import * as THREE from 'three';
import { Input } from '../core/Input.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { SFX, Music } from '../core/Audio.js';
import { Level } from '../levels/Level.js';
import { Player } from '../entities/Player.js';
import { CameraRig } from '../entities/CameraRig.js';
import { ParticleSystem } from '../entities/Particles.js';
import { HUD } from '../ui/HUD.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { distance2D } from '../core/Collision.js';

const APP = document.getElementById('app');

// ---------------------------------------------------------------------------
// The actual "play a level" screen. Owns the Three.js scene/camera, the
// Level (environment + entities), one or two Players, the HUD/dialogue/
// pause overlays, and every gameplay collision rule (stomp vs. touch
// damage, ground-pound shockwaves, pickups, checkpoints, the goal, and
// boss hits). This is deliberately one file: level content itself lives
// in data (levels/*), so this file only needs to change when a genuinely
// new *mechanic* is added.
// ---------------------------------------------------------------------------
export class GameplayScene {
  async init(payload) {
    this.payload = payload;
    this.levelSpec = payload.levelSpec;
    this.multiplayer = !!payload.multiplayer;
    this.onExit = payload.onExit || (() => {});
    this.onLevelComplete = payload.onLevelComplete || (() => {});

    this.threeScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 140);

    this.level = new Level(this.levelSpec, this.threeScene);
    this.particles = new ParticleSystem(this.threeScene);
    this.cameraRig = new CameraRig(this.camera);
    if (this.levelSpec.cameraLaneZ !== undefined) this.cameraRig.setLane(this.levelSpec.cameraLaneZ);

    const start = this.levelSpec.playerStart;
    this.player1 = new Player({ character: 'mario', playerId: 'p1', x: start.x, y: start.y, z: start.z });
    this.player1.setSpawn(start.x, start.y, start.z);
    this.players = [this.player1];

    if (this.multiplayer) {
      // Spawn P2 exactly on top of P1 rather than offset - level starting
      // platforms vary in size, and an offset spawn can land P2 off the
      // edge on some levels. Players don't collide with each other, so an
      // identical start position is perfectly safe and they separate the
      // instant either one moves.
      this.player2 = new Player({ character: 'luigi', playerId: 'p2', x: start.x, y: start.y, z: start.z });
      this.player2.setSpawn(start.x, start.y, start.z);
      this.players.push(this.player2);
    } else {
      this.player2 = null;
    }
    for (const p of this.players) this._wirePlayer(p);

    for (const p of this.players) this.threeScene.add(p.group);
    this.cameraRig.snapTo(this.player1.position);

    this.hud = new HUD(APP);
    this.hud.setMultiplayer(this.multiplayer);
    this.hud.showLevelName(this.levelSpec.name);
    this.dialogueBox = new DialogueBox(APP);
    this.pauseMenu = new PauseMenu(APP, {
      onResume: () => this._setPaused(false),
      onRestart: () => this._restartLevel(),
      onQuit: () => this._quitToMap(),
    });

    this.paused = false;
    this.levelComplete = false;
    this.gameOverTimer = 0;
    this.completeTimer = 0;
    this.respawningPlayers = new Map();

    SFX.unlock();
    Music.playTrack(this.levelSpec.isBoss ? 'boss' : this.level.theme.key);

    if (this.levelSpec.introDialogue?.length) {
      for (const p of this.players) p.frozen = true;
      this.dialogueBox.play(this.levelSpec.introDialogue, () => {
        for (const p of this.players) p.frozen = false;
      });
    }

    this.activeNpc = null;
  }

  _wirePlayer(p) {
    p.onGroundPoundImpact = (x, y, z) => {
      this.particles.ring(x, y, z, 0xffe066);
      this.particles.burst(x, y + 0.2, z, 0xffe066, 10, 3);
      for (const enemy of this.level.enemies) {
        if (!enemy.alive) continue;
        if (distance2D(x, z, enemy.position.x, enemy.position.z) < 2.4) enemy.takeHit(true);
      }
      if (this.level.boss?.vulnerable && distance2D(x, z, this.level.boss.position.x, this.level.boss.position.z) < 3.2) {
        this.level.boss.takeHit();
      }
    };
    p.onDeath = (player) => this._handlePlayerDeath(player);
  }

  onResize(w, h) {
    if (!this.camera) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _setPaused(v) {
    this.paused = v;
    if (v) this.pauseMenu.show(); else this.pauseMenu.hide();
  }

  _restartLevel() {
    this.onExit({ type: 'restart', levelSpec: this.levelSpec, multiplayer: this.multiplayer, onLevelComplete: this.onLevelComplete });
  }

  _quitToMap() {
    Music.stop();
    this.onExit({ type: 'quit' });
  }

  _handlePlayerDeath(player) {
    if (player.lives > 0) {
      this.respawningPlayers.set(player.playerId, 1.1);
    } else {
      // Out of lives: soft-restart the whole level after a short pause.
      this.gameOverTimer = 1.6;
    }
  }

  _checkEnemyCollisions(dt) {
    for (const enemy of this.level.enemies) {
      if (!enemy.alive) continue;
      for (const player of this.players) {
        if (!player || player.dead || player.invulnTimer > 0) continue;
        const d = distance2D(player.position.x, player.position.z, enemy.position.x, enemy.position.z);
        if (d < enemy.radius + player.radius) {
          const stompAttempt = player.velocity.y < -0.5 && player.position.y > enemy.position.y + (enemy.bodyHeight || 0.8) * 0.45;
          if (stompAttempt && enemy.config.stompable) {
            enemy.takeHit(true);
            player.velocity.y = 7.2;
            player.jumpCount = 1;
            SFX.play('stomp');
            this.particles.burst(enemy.position.x, enemy.position.y + 0.3, enemy.position.z, 0xffffff, 6, 2);
            if (enemy.config.explodes && !enemy.alive) this._explode(enemy, player);
          } else if (stompAttempt && !enemy.config.stompable) {
            player.velocity.y = 6;
            player.takeDamage(1, new THREE.Vector3(player.position.x - enemy.position.x, 0, player.position.z - enemy.position.z).normalize());
          } else {
            const knock = new THREE.Vector3(player.position.x - enemy.position.x, 0, player.position.z - enemy.position.z);
            if (knock.lengthSq() < 0.0001) knock.set(0, 0, 1); else knock.normalize();
            player.takeDamage(enemy.config.touchDamage || 1, knock);
          }
        }
      }
      // Player attack hitbox vs enemy.
      for (const player of this.players) {
        if (!player || player.dead || player.attackHasHit) continue;
        const hb = player.getAttackHitbox();
        if (!hb) continue;
        if (distance2D(hb.x, hb.z, enemy.position.x, enemy.position.z) < hb.radius + enemy.radius) {
          enemy.takeHit(false);
          player.attackHasHit = true;
          this.particles.burst(enemy.position.x, enemy.position.y + 0.4, enemy.position.z, 0xffffff, 5, 2);
          if (enemy.config.explodes && !enemy.alive) this._explode(enemy, player);
        }
      }
    }
  }

  _explode(enemy, nearPlayer) {
    this.particles.burst(enemy.position.x, enemy.position.y + 0.3, enemy.position.z, 0xff5a1f, 14, 4.5);
    for (const player of this.players) {
      if (!player || player.dead || player.invulnTimer > 0) continue;
      if (distance2D(player.position.x, player.position.z, enemy.position.x, enemy.position.z) < 1.9) {
        const knock = new THREE.Vector3(player.position.x - enemy.position.x, 0, player.position.z - enemy.position.z);
        if (knock.lengthSq() < 0.0001) knock.set(0, 0, 1); else knock.normalize();
        player.takeDamage(1, knock);
      }
    }
  }

  _checkBossCollisions() {
    const boss = this.level.boss;
    if (!boss || boss.defeated) return;
    for (const player of this.players) {
      if (!player || player.dead || player.invulnTimer > 0) continue;
      const d = distance2D(player.position.x, player.position.z, boss.position.x, boss.position.z);
      if (d < boss.radius + player.radius) {
        const knock = new THREE.Vector3(player.position.x - boss.position.x, 0, player.position.z - boss.position.z);
        if (knock.lengthSq() < 0.0001) knock.set(0, 0, 1); else knock.normalize();
        player.takeDamage(boss.touchDamage || 1, knock);
      }
      if (!player.attackHasHit) {
        const hb = player.getAttackHitbox();
        if (hb && boss.vulnerable && distance2D(hb.x, hb.z, boss.position.x, boss.position.z) < hb.radius + boss.radius) {
          boss.takeHit();
          player.attackHasHit = true;
          this.particles.burst(boss.position.x, boss.position.y + 1, boss.position.z, 0xffffff, 8, 3);
        }
      }
    }
    if (boss.consumeSlamHit()) {
      for (const player of this.players) {
        if (!player || player.dead || player.invulnTimer > 0) continue;
        if (distance2D(player.position.x, player.position.z, boss.position.x, boss.position.z) < 3.6) {
          const knock = new THREE.Vector3(player.position.x - boss.position.x, 0, player.position.z - boss.position.z);
          if (knock.lengthSq() < 0.0001) knock.set(0, 0, 1); else knock.normalize();
          player.takeDamage(1, knock);
        }
      }
    }
    if (boss.finished && !this.levelComplete) {
      this._completeLevel();
    }
  }

  _checkHazards(dt) {
    for (const zone of this.level.hazardZones) {
      for (const player of this.players) {
        if (!player || player.dead) continue;
        if (zone.testPlayer(player.position.x, player.position.y, player.position.z)) {
          if (zone.instaKill) {
            if (player.invulnTimer <= 0) {
              player.velocity.y = 6;
              player.takeDamage(player.maxHealth, new THREE.Vector3(0, 0, 1));
            }
          } else if (player.invulnTimer <= 0) {
            player.takeDamage(1, new THREE.Vector3(0, 0, 1));
          }
        }
      }
    }
    for (const player of this.players) {
      if (!player || player.dead) continue;
      if (player.position.y < this.level.killY) {
        player.velocity.y = 0;
        player.takeDamage(1, new THREE.Vector3(0, 0, 1));
        if (!player.dead) player.respawnAtCheckpoint();
      }
    }
  }

  _checkBlocks() {
    for (const block of this.level.blocks) {
      if (block.used) continue;
      const col = block.collider;
      for (const player of this.players) {
        if (!player || player.dead || player.velocity.y <= 0) continue;
        const withinX = player.position.x > col.minX - player.radius && player.position.x < col.maxX + player.radius;
        const withinZ = player.position.z > col.minZ - player.radius && player.position.z < col.maxZ + player.radius;
        const headY = player.position.y + player.height;
        if (withinX && withinZ && headY > col.minY - 0.15 && headY < col.minY + 0.35) {
          if (block.bump((x, y, z, contents) => this.level.dispenseFromBlock(x, y, z, contents))) {
            player.velocity.y = Math.min(player.velocity.y, -2);
            this.particles.burst(col.x, col.y + 0.6, col.z, 0xffd54a, 6, 2);
          }
        }
      }
    }
  }

  _checkPickupsAndTriggers() {
    for (const player of this.players) {
      if (!player || player.dead) continue;
      for (const coin of this.level.coins) {
        if (coin.tryCollect(player.position.x, player.position.z, player.position.y)) player.collectCoin(1);
      }
      for (const star of this.level.stars) {
        if (star.tryCollect(player.position.x, player.position.z, player.position.y)) player.collectStar(star.id);
      }
      for (const cp of this.level.checkpoints) {
        if (cp.tryActivate(player.position.x, player.position.z)) {
          for (const pl of this.players) pl.setSpawn(cp.position.x, cp.position.y + 1, cp.position.z);
        }
      }
      if (this.level.goal && !this.levelComplete && this.level.goal.tryReach(player.position.x, player.position.z)) {
        this._completeLevel();
      }
    }
  }

  _checkNpcs() {
    this.activeNpc = null;
    for (const npc of this.level.npcs) {
      if (npc.inRange && npc.dialogue) { this.activeNpc = npc; break; }
    }
    if (this.activeNpc && !this.dialogueBox.isActive()) {
      this.hud.showPrompt(this.activeNpc.promptText || 'Talk');
      return;
    }

    // Hint signs are passive - no NPC to talk to, just show the tip while nearby.
    for (const sign of this.level.hintSigns) {
      for (const player of this.players) {
        if (!player || player.dead) continue;
        if (distance2D(player.position.x, player.position.z, sign.position.x, sign.position.z) < sign.radius) {
          this.hud.showPrompt(sign.text);
          return;
        }
      }
    }
    this.hud.hidePrompt();
  }

  _completeLevel() {
    this.levelComplete = true;
    this.completeTimer = 0;
    SFX.play('complete');
    Music.stop();
    for (const p of this.players) p.controlEnabled = false;
    const starsCollected = new Set();
    let coins = 0;
    for (const p of this.players) {
      for (const id of p.starsCollected) starsCollected.add(id);
      coins += p.coins;
    }
    this._pendingResult = { stars: Array.from(starsCollected), coins };
  }

  update(dt) {
    const p1Input = Input.getPlayerState('p1');
    const p2Input = this.multiplayer ? Input.getPlayerState('p2') : null;

    if (p1Input?.pausePressed || p2Input?.pausePressed) {
      if (!this.dialogueBox.isActive() && !this.levelComplete) this._setPaused(!this.paused);
    }
    if (this.paused) return;

    if (this.dialogueBox.isActive()) {
      if (p1Input?.actionPressed || p2Input?.actionPressed) this.dialogueBox.advance();
      for (const p of this.players) p.update(dt, null, this.level.colliders, this.cameraRig.getYaw());
      this._updateCameraAndParticles(dt);
      this.hud.update(this.players, this.level);
      return;
    }

    if (this.activeNpc && (p1Input?.actionPressed || p2Input?.actionPressed)) {
      for (const p of this.players) p.frozen = true;
      this.dialogueBox.play(this.activeNpc.dialogue, () => { for (const p of this.players) p.frozen = false; });
      this.hud.hidePrompt();
    }

    if (this.levelComplete) {
      this.completeTimer += dt;
      for (const p of this.players) p.update(dt, null, this.level.colliders, this.cameraRig.getYaw());
      this._updateCameraAndParticles(dt);
      this.hud.update(this.players, this.level);
      if (this.completeTimer > 2.2) this._finishAndExit();
      return;
    }

    if (this.gameOverTimer > 0) {
      this.gameOverTimer -= dt;
      this.hud.fadeToBlack(true);
      if (this.gameOverTimer <= 0) this._restartLevel();
      return;
    }

    for (const [pid, timer] of Array.from(this.respawningPlayers.entries())) {
      const t = timer - dt;
      if (t <= 0) {
        const p = this.players.find((pl) => pl.playerId === pid);
        if (p) p.reviveAtCheckpoint();
        this.respawningPlayers.delete(pid);
      } else {
        this.respawningPlayers.set(pid, t);
      }
    }

    this.player1.update(dt, p1Input, this.level.colliders, this.cameraRig.getYaw());
    if (this.player2) this.player2.update(dt, p2Input, this.level.colliders, this.cameraRig.getYaw());

    this.level.update(dt, this.players, this.particles);
    this._checkEnemyCollisions(dt);
    this._checkBossCollisions();
    this._checkBlocks();
    this._checkHazards(dt);
    this._checkPickupsAndTriggers();
    this._checkNpcs();
    this._updateCameraAndParticles(dt);
    this.hud.update(this.players, this.level);
    this.hud.fadeToBlack(false);
  }

  _updateCameraAndParticles(dt) {
    const targets = this.players.filter((p) => p).map((p) => p.position);
    this.cameraRig.update(dt, targets, this.level.collisionMeshes);
    this.particles.update(dt);
  }

  _finishAndExit() {
    const world = this.levelSpec.world;
    const isLastInWorld = this.levelSpec.index === 4;
    SaveSystem.recordLevelComplete(this.levelSpec.id, this._pendingResult.stars, this._pendingResult.coins, world, isLastInWorld);
    if (this.levelSpec.isTutorial) SaveSystem.markTutorialDone();
    Music.stop();
    this.onLevelComplete({
      levelId: this.levelSpec.id, world, index: this.levelSpec.index,
      stars: this._pendingResult.stars, isLastInWorld, isBoss: this.levelSpec.isBoss,
    });
  }

  render(renderer) {
    renderer.render(this.threeScene, this.camera);
  }

  dispose() {
    this.hud?.dispose();
    this.dialogueBox?.dispose();
    this.pauseMenu?.dispose();
  }
}
