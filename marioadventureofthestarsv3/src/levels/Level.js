import * as THREE from 'three';
import { createPlatform } from '../entities/Platform.js';
import { createHazardZone, createSpikeTrap, createSpikePit, createCrumblePlatform } from '../entities/Hazard.js';
import { createCoin, createStar } from '../entities/Pickups.js';
import { createLuckyBlock } from '../entities/Block.js';
import { createCheckpoint } from '../entities/Checkpoint.js';
import { createGoal } from '../entities/Goal.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { NPC } from '../entities/NPC.js';
import { createHintSign } from '../entities/HintSign.js';
import { createTree, createCloud, createRock, createFlower, createPipe, createSign, createBush, createMountainBackdrop } from '../entities/Props.js';
import { ProjectileSystem } from '../entities/Projectile.js';
import { makeCollider } from '../core/Collision.js';
import { WORLD_THEMES } from '../core/Config.js';
import { BOSS_CONFIGS } from './bosses.js';
import { setupSceneLighting } from '../utils/lighting.js';

const PROP_BUILDERS = {
  tree: (p) => createTree(p.x, p.y, p.z, p.opts),
  cloud: (p) => createCloud(p.x, p.y, p.z, p.opts),
  rock: (p) => createRock(p.x, p.y, p.z, p.opts),
  flower: (p) => createFlower(p.x, p.y, p.z, p.opts),
  sign: (p) => createSign(p.x, p.y, p.z, p.opts),
  bush: (p) => createBush(p.x, p.y, p.z, p.opts),
};

/**
 * Turns a level-data spec (see levels/builder.js) into live Three.js
 * objects + gameplay entities. This is the ONE place that interprets
 * level JSON - add a new spec field here, not scattered across scenes.
 */
export class Level {
  constructor(spec, scene) {
    this.spec = spec;
    this.scene = scene;
    this.theme = WORLD_THEMES.find((w) => w.key === spec.theme) || WORLD_THEMES[0];
    this.projectiles = new ProjectileSystem(scene);

    this.platforms = [];
    this.colliders = [];
    this.hazardZones = [];
    this.coins = [];
    this.stars = [];
    this.blocks = [];
    this.checkpoints = [];
    this.enemies = [];
    this.npcs = [];
    this.hintSigns = [];
    this.collisionMeshes = []; // for camera occlusion raycasts
    this.pipes = [];

    this._buildEnvironment();
    this._buildPlatforms();
    this._buildBlocks();
    this._buildHazards();
    this._buildPickups();
    this._buildCheckpoints();
    this._buildHintSigns();
    this._buildEnemies();
    this._buildProps();
    this._buildNPCs();
    this._buildGoal();
    this._buildBoss();

    this.killY = spec.killY ?? -14;
    this.time = 0;
    this.totalCoins = this.coins.length;
    this.totalStars = this.stars.length;
  }

  _buildEnvironment() {
    this.scene.background = new THREE.Color(this.theme.sky);
    this.scene.fog = new THREE.Fog(this.theme.fog, 28, 85);
    const { sun } = setupSceneLighting(this.scene, this.theme.sky);
    this.sun = sun;

    // Two layered mountain silhouettes behind the play area, so the side-on
    // camera always has a grounded backdrop instead of open sky. Colors are
    // the ground tone blended toward the fog color (atmospheric perspective)
    // rather than raw theme accents, which read as too saturated at a
    // distance; the far layer is darker/further for a sense of depth.
    const groundColor = new THREE.Color(this.theme.ground);
    const fogColor = new THREE.Color(this.theme.fog);
    const farColor = groundColor.clone().lerp(fogColor, 0.55).multiplyScalar(0.75);
    const nearColor = groundColor.clone().lerp(fogColor, 0.3).multiplyScalar(0.85);
    const seedBase = (this.spec.world || 0) * 7 + (this.spec.index || 0);
    const far = createMountainBackdrop({ color: farColor.getHex(), z: -34, peakMin: 20, peakMax: 40, seed: seedBase + 1 });
    const near = createMountainBackdrop({ color: nearColor.getHex(), z: -22, peakMin: 12, peakMax: 26, seed: seedBase + 5 });
    this.scene.add(far, near);

    // A handful of drifting background clouds for atmosphere (very cheap).
    this.bgClouds = [];
    for (let i = 0; i < 5; i++) {
      const c = createCloud((Math.random() - 0.5) * 80, 14 + Math.random() * 6, -20 - Math.random() * 20, { scale: 1.5 + Math.random() });
      this.scene.add(c);
      this.bgClouds.push({ mesh: c, speed: 0.3 + Math.random() * 0.4 });
    }
  }

  _buildPlatforms() {
    for (const p of this.spec.platforms || []) {
      const platform = p.crumble ? createCrumblePlatform(p) : createPlatform(p);
      this.scene.add(platform.mesh);
      this.platforms.push(platform);
      this.colliders.push(platform.collider);
      this.collisionMeshes.push(platform.mesh);
    }
    // Invisible wall colliders (no mesh) - just keep the player from
    // wandering off the edge of the level, e.g. behind the start.
    for (const w of this.spec.boundaryWalls || []) {
      this.colliders.push(makeCollider(w.x, w.y, w.z, w.sx, w.sy, w.sz, { noGround: true }));
    }
  }

  _buildBlocks() {
    for (const b of this.spec.blocks || []) {
      const block = createLuckyBlock(b);
      this.scene.add(block.mesh);
      this.blocks.push(block);
      this.colliders.push(block.collider);
      this.collisionMeshes.push(block.mesh);
    }
  }

  /** Spawns a coin or star popped from a bumped Lucky Block. */
  dispenseFromBlock(x, y, z, contents) {
    if (contents === 'star') {
      const star = createStar({ x, y, z, id: `blockstar_${x}_${z}` });
      this.scene.add(star.mesh);
      this.stars.push(star);
    } else {
      const coin = createCoin({ x, y, z, id: `blockcoin_${x}_${z}_${Math.random()}` });
      this.scene.add(coin.mesh);
      this.coins.push(coin);
    }
  }

  _buildHazards() {
    for (const h of this.spec.hazards || []) {
      let zone;
      if (h.kind === 'spikes') zone = createSpikeTrap(h);
      else if (h.kind === 'spikepit') zone = createSpikePit(h);
      else zone = createHazardZone(h);
      this.scene.add(zone.mesh);
      this.hazardZones.push(zone);
    }
  }

  _buildPickups() {
    for (const c of this.spec.coins || []) {
      const coin = createCoin(c);
      this.scene.add(coin.mesh);
      this.coins.push(coin);
    }
    for (const s of this.spec.stars || []) {
      const star = createStar(s);
      this.scene.add(star.mesh);
      this.stars.push(star);
    }
  }

  _buildCheckpoints() {
    for (const c of this.spec.checkpoints || []) {
      const cp = createCheckpoint(c);
      this.scene.add(cp.mesh);
      this.checkpoints.push(cp);
    }
  }

  _buildEnemies() {
    for (const e of this.spec.enemies || []) {
      const enemy = new Enemy(e.type, e, this.projectiles);
      this.scene.add(enemy.group);
      this.enemies.push(enemy);
    }
  }

  _buildProps() {
    for (const p of this.spec.props || []) {
      const builder = PROP_BUILDERS[p.kind];
      if (!builder) continue;
      const obj = builder(p);
      this.scene.add(obj);
    }
    for (const p of this.spec.pipes || []) {
      const pipe = createPipe(p.x, p.y, p.z, p.opts);
      this.scene.add(pipe.group);
      if (pipe.collider) { this.colliders.push(pipe.collider); this.collisionMeshes.push(pipe.group); }
      this.pipes.push(pipe);
    }
  }

  _buildNPCs() {
    for (const n of this.spec.npcs || []) {
      const npc = new NPC(n);
      this.scene.add(npc.group);
      this.npcs.push(npc);
    }
  }

  _buildHintSigns() {
    for (const s of this.spec.hintSigns || []) {
      const sign = createHintSign(s);
      this.scene.add(sign.mesh);
      this.hintSigns.push(sign);
    }
  }

  _buildGoal() {
    if (!this.spec.goal) return;
    this.goal = createGoal(this.spec.goal);
    this.scene.add(this.goal.mesh);
  }

  _buildBoss() {
    if (!this.spec.boss) { this.boss = null; return; }
    const config = BOSS_CONFIGS[this.spec.boss.type];
    if (!config) { console.warn(`[Level] unknown boss type "${this.spec.boss.type}"`); this.boss = null; return; }
    this.boss = new Boss(config, this.spec.boss, this.projectiles);
    this.boss.spawnEnemyFn = (type, x, y, z) => {
      const enemy = new Enemy(type, { x, y, z, range: 2 }, this.projectiles);
      this.scene.add(enemy.group);
      this.enemies.push(enemy);
    };
    this.scene.add(this.boss.group);
  }

  update(dt, players, particleSystem) {
    this.time += dt;
    for (const platform of this.platforms) platform.update(dt);
    for (const block of this.blocks) block.update(dt);
    for (const zone of this.hazardZones) zone.update(dt, this.time);
    for (const coin of this.coins) coin.update(dt, this.time);
    for (const star of this.stars) star.update(dt, this.time);
    for (const cp of this.checkpoints) cp.update(dt, this.time);
    for (const enemy of this.enemies) enemy.update(dt, this.time, players, this.colliders);
    for (const npc of this.npcs) npc.update(dt, players);
    if (this.goal) this.goal.update(dt, this.time);
    if (this.boss) this.boss.update(dt, this.time, players, this.colliders, particleSystem);
    this.enemies = this.enemies.filter((e) => {
      if (!e.finished) return true;
      this.scene.remove(e.group);
      return false;
    });
    this.projectiles.update(dt, players, (player, proj) => {
      player.takeDamage(proj.damage, new THREE.Vector3(player.position.x - proj.mesh.position.x, 0, player.position.z - proj.mesh.position.z).normalize());
    });
    for (const c of this.bgClouds) {
      c.mesh.position.x += c.speed * dt;
      if (c.mesh.position.x > 60) c.mesh.position.x = -60;
    }

    // Carry players standing on moving/crumbling platforms.
    for (const platform of this.platforms) {
      if (!platform.move && platform.crumbleState === undefined) continue;
      for (const p of players) {
        if (!p || p.dead) continue;
        if (p.groundCollider === platform.collider) {
          p.position.x += platform.deltaX || 0;
          p.position.y += platform.deltaY || 0;
          p.position.z += platform.deltaZ || 0;
          p.group.position.copy(p.position);
          if (platform.notifyStanding) platform.notifyStanding(dt);
        } else if (platform.notifyNotStanding) {
          // only reset if nobody else stands on it
        }
      }
    }
    for (const platform of this.platforms) {
      if (!platform.notifyNotStanding) continue;
      const someoneStanding = players.some((p) => p && p.groundCollider === platform.collider);
      if (!someoneStanding) platform.notifyNotStanding();
    }
  }

  dispose() {
    // Scene disposal is handled by GameplayScene tearing down the whole THREE.Scene;
    // nothing owns external resources (audio/textures are cached & shared globally).
  }
}
