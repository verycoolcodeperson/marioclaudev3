import * as THREE from 'three';
import { Input } from '../core/Input.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { SFX, Music } from '../core/Audio.js';
import { Player } from '../entities/Player.js';
import { CameraRig } from '../entities/CameraRig.js';
import { NPC } from '../entities/NPC.js';
import { createPlatform } from '../entities/Platform.js';
import { createTree, createCloud, createRock, createFlower, createBush, createSign } from '../entities/Props.js';
import { makeCollider, distance2D } from '../core/Collision.js';
import { WORLD_THEMES } from '../core/Config.js';
import { HUD } from '../ui/HUD.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { getWorldLevels, getTutorialLevel } from '../levels/registry.js';
import { GAME_INTRO, WORLD_INTRO, WORLD_OUTRO } from '../story/dialogue.js';
import { setupSceneLighting } from '../utils/lighting.js';
import { waveTexture } from '../utils/textures.js';

const APP = document.getElementById('app');
const DECOR_BUILDERS = [createTree, createBush, createRock];

/**
 * A small walkable 3D diorama used for BOTH the main hub (8 world gates)
 * and each world's level-select screen (4 level gates). Mario walks up to
 * a gate and presses the action key to enter. Locked/completed gates are
 * visually distinct. Reused instead of building two separate scenes.
 */
export class WorldMapScene {
  async init({ mode = 'hub', world = 1, multiplayerIntent = false, cameFrom = null } = {}) {
    this.mode = mode;
    this.world = world;
    this.multiplayerIntent = multiplayerIntent;

    this.threeScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 140);
    this.cameraRig = new CameraRig(this.camera, 'overworld');
    this.colliders = [];
    this.collisionMeshes = [];
    this.gates = [];
    this.npcs = [];

    this._buildEnvironment();
    if (mode === 'hub') this._buildHubGates(); else this._buildWorldGates();

    const start = { x: 0, y: 1, z: mode === 'hub' ? 6 : 4 };
    this.player = new Player({ character: 'mario', playerId: 'p1', x: start.x, y: start.y, z: start.z });
    this.threeScene.add(this.player.group);
    this.cameraRig.snapTo(this.player.position);

    this.hud = new HUD(APP);
    this.dialogueBox = new DialogueBox(APP);
    this.promptTarget = null;
    this.transitioning = false;

    Music.playTrack(mode === 'hub' ? 'hub' : this.theme.key);
    SFX.unlock();

    if (mode === 'hub' && !SaveSystem.hasSeenStory('game_intro')) {
      this.player.frozen = true;
      this.dialogueBox.play(GAME_INTRO, () => { this.player.frozen = false; });
      SaveSystem.markStorySeen('game_intro');
    } else if (mode === 'world') {
      const introKey = `world${world}_intro`;
      if (!SaveSystem.hasSeenStory(introKey) && WORLD_INTRO[world]) {
        this.player.frozen = true;
        this.dialogueBox.play(WORLD_INTRO[world], () => { this.player.frozen = false; });
        SaveSystem.markStorySeen(introKey);
      }
    }

    if (cameFrom?.justCompletedLevel && cameFrom.isLastInWorld) {
      const outroKey = `world${cameFrom.world}_outro`;
      if (!SaveSystem.hasSeenStory(outroKey) && WORLD_OUTRO[cameFrom.world]) {
        this.player.frozen = true;
        setTimeout(() => {
          this.dialogueBox.play(WORLD_OUTRO[cameFrom.world], () => { this.player.frozen = false; });
        }, 300);
        SaveSystem.markStorySeen(outroKey);
      }
    }
  }

  _buildEnvironment() {
    this.theme = this.mode === 'hub' ? { sky: 0x7ec0ee, fog: 0xcfe9ff, ground: 0x62b34a, accent: 0x2e7d32, key: 'hub' } : WORLD_THEMES.find((w) => w.id === this.world);
    this.threeScene.background = new THREE.Color(this.theme.sky);
    this.threeScene.fog = new THREE.Fog(this.theme.fog, 30, 90);
    setupSceneLighting(this.threeScene, this.theme.sky, { shadowSize: 32 });

    const groundSize = this.mode === 'hub' ? 46 : 30;
    const ground = createPlatform({ x: 0, y: -11, z: 0, sx: groundSize, sy: 22, sz: groundSize, color: this.theme.ground, textureType: 'grass' });
    this.threeScene.add(ground.mesh);
    this.colliders.push(ground.collider);

    // Invisible perimeter walls - the diorama is free-roam in any direction,
    // so it needs a boundary on all four sides, not just one.
    const half = groundSize / 2;
    const wallSpecs = [
      { x: 0, z: -half - 1, sx: groundSize + 4, sz: 3 },
      { x: 0, z: half + 1, sx: groundSize + 4, sz: 3 },
      { x: -half - 1, z: 0, sx: 3, sz: groundSize + 4 },
      { x: half + 1, z: 0, sx: 3, sz: groundSize + 4 },
    ];
    for (const w of wallSpecs) {
      this.colliders.push(makeCollider(w.x, 5, w.z, w.sx, 44, w.sz, { noGround: true }));
    }
    this.collisionMeshes.push(ground.mesh);

    for (let i = 0; i < (this.mode === 'hub' ? 34 : 20); i++) {
      const builder = DECOR_BUILDERS[i % DECOR_BUILDERS.length];
      const angle = Math.random() * Math.PI * 2;
      const rad = 5 + Math.random() * (groundSize / 2 - 4);
      const obj = builder(Math.cos(angle) * rad, 0, Math.sin(angle) * rad, { scale: 0.8 + Math.random() * 0.5 });
      this.threeScene.add(obj);
    }
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * (groundSize / 2 - 3);
      this.threeScene.add(createFlower(Math.cos(a) * r, 0, Math.sin(a) * r, { color: [0xff6a9c, 0xffe066, 0xffffff][i % 3] }));
    }
    for (let i = 0; i < 6; i++) {
      const c = createCloud((Math.random() - 0.5) * 60, 13 + Math.random() * 5, -18 - Math.random() * 18, { scale: 1.4 + Math.random() });
      this.threeScene.add(c);
    }

    if (this.mode === 'hub') {
      this._buildFountain();
      this._buildDistantCastle();
    }
  }

  /** A small central landmark so the hub reads as a real place, not an empty field. */
  _buildFountain() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.5, 20), new THREE.MeshLambertMaterial({ color: 0xd8d8d8 }));
    base.position.y = 0.25;
    base.castShadow = true; base.receiveShadow = true;
    g.add(base);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.12, 20), new THREE.MeshStandardMaterial({ map: waveTexture(0x3fc1d6, 0x8fe6f2, 6), transparent: true, opacity: 0.92 }));
    water.position.y = 0.54;
    g.add(water);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.3, 10), new THREE.MeshLambertMaterial({ color: 0xf0f0f0 }));
    pedestal.position.y = 1.1;
    pedestal.castShadow = true;
    g.add(pedestal);

    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.5 : 0.22;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(px, py); else starShape.lineTo(px, py);
    }
    starShape.closePath();
    const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
    this.fountainStar = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x998200, emissiveIntensity: 0.5 }));
    this.fountainStar.position.set(-0.25, 2.1, -0.1);
    this.fountainStar.castShadow = true;
    g.add(this.fountainStar);
    const light = new THREE.PointLight(0xffe066, 0.7, 8);
    light.position.set(0, 2.4, 0);
    g.add(light);

    this.threeScene.add(g);
    const collider = makeCollider(0, 0.6, 0, 5.4, 1.2, 5.4, { passthrough: false, noGround: true });
    this.colliders.push(collider);
    this.collisionMeshes.push(base, pedestal);
  }

  /** A dark castle silhouette on the horizon - foreshadows World 8. Purely decorative. */
  _buildDistantCastle() {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x3a2f42 });
    const keep = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 6), mat);
    keep.position.y = 2.5;
    g.add(keep);
    const towerPositions = [[-3.2, 0, -3.2], [3.2, 0, -3.2], [-3.2, 0, 3.2], [3.2, 0, 3.2]];
    for (const [tx, ty, tz] of towerPositions) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 6.5, 8), mat);
      tower.position.set(tx, 3.25, tz);
      g.add(tower);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.4, 8), mat);
      roof.position.set(tx, 7.2, tz);
      g.add(roof);
    }
    g.position.set(-20, 0, -85);
    g.scale.setScalar(0.7);
    this.threeScene.add(g);
  }

  _gateArch(color, accent) {
    const g = new THREE.Group();
    const pillarGeo = new THREE.CylinderGeometry(0.38, 0.46, 3.2, 10);
    const pillarMat = new THREE.MeshLambertMaterial({ color });
    const baseGeo = new THREE.CylinderGeometry(0.62, 0.7, 0.3, 10);
    const baseMat = new THREE.MeshLambertMaterial({ color: accent || color });
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(side * 1.4, 1.75, 0);
      pillar.castShadow = true; pillar.receiveShadow = true;
      g.add(pillar);
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(side * 1.4, 0.15, 0);
      base.castShadow = true; base.receiveShadow = true;
      g.add(base);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.55, 0.65), pillarMat);
    top.position.set(0, 3.55, 0);
    top.castShadow = true;
    g.add(top);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 0.7), baseMat);
    trim.position.set(0, 3.85, 0);
    g.add(trim);
    return g;
  }

  _addGate({ id, x, z, label, color, accent, icon, locked, completed, stars = 0, onEnter, kind = 'world' }) {
    const group = this._gateArch(locked ? 0x6b6b6b : color, locked ? 0x555555 : accent);
    group.position.set(x, 0, z);
    this.threeScene.add(group);

    if (completed) {
      const starGeo = new THREE.SphereGeometry(0.18, 8, 6);
      const starMesh = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x998200, emissiveIntensity: 0.5 }));
      starMesh.position.set(x, 4.15, z);
      this.threeScene.add(starMesh);
      this.gateStars = this.gateStars || [];
      this.gateStars.push(starMesh);
    }

    const signRotation = Math.atan2(-x, -z);
    const sign = createSign(x, 0, z + (z >= 0 ? 1.6 : -1.6), { rotationY: signRotation, icon: locked ? '🔒' : icon });
    this.threeScene.add(sign);

    this.gates.push({ id, x, z, label, locked, completed, stars, onEnter, kind, radius: 2.4 });
  }

  _buildHubGates() {
    const radius = 17;
    for (const theme of WORLD_THEMES) {
      const angle = (theme.id - 1) / WORLD_THEMES.length * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const unlocked = SaveSystem.data.unlockedWorlds.includes(theme.id);
      const worldStars = SaveSystem.totalStarsForWorld(theme.id);
      const worldComplete = !!SaveSystem.data.levels[`${theme.id}-4`]?.completed;
      this._addGate({
        id: `world${theme.id}`, x, z, label: `WORLD ${theme.id}\n${theme.name}`,
        color: theme.accent, accent: theme.secondary, icon: theme.icon,
        locked: !unlocked, completed: worldComplete, stars: worldStars,
        onEnter: () => this._enterWorld(theme.id),
      });
      // A small themed planting behind each unlocked gate hints at the world beyond it.
      if (unlocked) {
        const bx = Math.cos(angle) * (radius + 2.5);
        const bz = Math.sin(angle) * (radius + 2.5);
        for (let j = 0; j < 3; j++) {
          const jx = bx + (Math.random() - 0.5) * 3;
          const jz = bz + (Math.random() - 0.5) * 3;
          const useTree = theme.key !== 'lava' && theme.key !== 'castle';
          const obj = useTree
            ? createTree(jx, 0, jz, { leafColor: theme.secondary, trunkColor: 0x6b4a2b, scale: 0.9 })
            : createRock(jx, 0, jz, { color: theme.secondary, scale: 1.1 });
          this.threeScene.add(obj);
        }
      }
    }
    // Tutorial gate near spawn.
    const tutorialDone = SaveSystem.data.tutorialDone;
    this._addGate({
      id: 'tutorial', x: 0, z: -8, label: 'TUTORIAL\nToad\'s Lesson',
      color: 0xffe066, accent: 0xffffff, icon: '📖',
      locked: false, completed: tutorialDone, stars: 0,
      onEnter: () => this._enterTutorial(),
    });

    const toad = new NPC({
      character: 'toad', x: -3, z: -4, facing: Math.PI * 0.25,
      dialogue: [
        { character: 'toad', name: 'Toad', text: "Welcome back! Walk into a World gate to explore it." },
        { character: 'toad', name: 'Toad', text: 'New here? Try the Tutorial gate first!' },
      ],
      promptText: 'Talk to Toad',
    });
    this.threeScene.add(toad.group);
    this.npcs.push(toad);
  }

  _buildWorldGates() {
    const levels = getWorldLevels(this.world);
    const spacing = 7;
    levels.forEach((lvl, i) => {
      const x = (i - 1.5) * spacing;
      const z = 0;
      const progress = SaveSystem.getLevelProgress(lvl.id);
      const locked = !SaveSystem.isLevelUnlocked(lvl.id, this.world, i + 1);
      this._addGate({
        id: lvl.id, x, z, label: `${lvl.id}\n${lvl.name}`,
        color: this.theme.accent, accent: this.theme.secondary, icon: lvl.isBoss ? '👑' : this.theme.icon,
        locked, completed: progress.completed, stars: progress.stars.length,
        onEnter: () => this._enterLevel(lvl),
        kind: lvl.isBoss ? 'boss' : 'level',
      });
    });

    this._addGate({
      id: 'back', x: 0, z: 12, label: 'BACK TO MAP', color: 0x999999, accent: 0xcccccc, icon: '🗺️', locked: false, completed: false,
      onEnter: () => this._returnToHub(),
    });
  }

  _enterWorld(worldId) {
    if (this.transitioning) return;
    this.transitioning = true;
    SFX.play('select');
    this.hud.fadeToBlack(true);
    setTimeout(() => this.sceneManager.goto('worldmap', { mode: 'world', world: worldId, multiplayerIntent: this.multiplayerIntent }), 380);
  }

  _returnToHub() {
    if (this.transitioning) return;
    this.transitioning = true;
    SFX.play('select');
    this.hud.fadeToBlack(true);
    setTimeout(() => this.sceneManager.goto('worldmap', { mode: 'hub', multiplayerIntent: this.multiplayerIntent }), 380);
  }

  _enterTutorial() {
    if (this.transitioning) return;
    this.transitioning = true;
    SFX.play('select');
    this.hud.fadeToBlack(true);
    const spec = getTutorialLevel();
    setTimeout(() => this.sceneManager.startLevel(spec, { multiplayer: this.multiplayerIntent, returnTo: { mode: 'hub', multiplayerIntent: this.multiplayerIntent } }), 380);
  }

  _enterLevel(lvl) {
    if (this.transitioning) return;
    this.transitioning = true;
    SFX.play('select');
    this.hud.fadeToBlack(true);
    setTimeout(() => this.sceneManager.startLevel(lvl, { multiplayer: this.multiplayerIntent, returnTo: { mode: 'world', world: this.world, multiplayerIntent: this.multiplayerIntent } }), 380);
  }

  onResize(w, h) {
    if (!this.camera) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    this._t = (this._t || 0) + dt;
    if (this.fountainStar) {
      this.fountainStar.rotation.y += dt * 1.4;
      this.fountainStar.position.y = 2.1 + Math.sin(this._t * 1.6) * 0.1;
    }
    if (this.gateStars) {
      for (const s of this.gateStars) { s.rotation.y += dt * 1.6; s.position.y += Math.sin(this._t * 2 + s.position.x) * 0.001; }
    }
    if (this.transitioning) return;

    if (this.dialogueBox.isActive()) {
      const input = Input.getPlayerState('p1');
      if (input?.actionPressed) this.dialogueBox.advance();
      this.player.update(dt, null, this.colliders, this.cameraRig.getYaw());
      this.cameraRig.update(dt, [this.player.position], this.collisionMeshes);
      return;
    }

    const input = Input.getPlayerState('p1');
    this.player.update(dt, input, this.colliders, this.cameraRig.getYaw());
    for (const npc of this.npcs) npc.update(dt, [this.player]);

    let nearestGate = null, nearestDist = Infinity;
    for (const gate of this.gates) {
      const d = distance2D(this.player.position.x, this.player.position.z, gate.x, gate.z);
      if (d < gate.radius && d < nearestDist) { nearestGate = gate; nearestDist = d; }
    }
    this.promptTarget = nearestGate;

    let npcTarget = null;
    for (const npc of this.npcs) if (npc.inRange) { npcTarget = npc; break; }

    if (npcTarget) {
      this.hud.showPrompt(npcTarget.promptText || 'Talk');
      if (input?.actionPressed) {
        this.player.frozen = true;
        this.dialogueBox.play(npcTarget.dialogue, () => { this.player.frozen = false; });
      }
    } else if (nearestGate) {
      if (nearestGate.locked) {
        this.hud.showPrompt(`${nearestGate.label.split('\n')[0]} - LOCKED`);
        if (input?.actionPressed) SFX.play('lockedBuzz');
      } else {
        const starText = nearestGate.kind === 'world' ? ` (${'⭐'.repeat(0)}${nearestGate.stars} stars)` : nearestGate.stars ? ` (${nearestGate.stars}/3 ⭐)` : '';
        this.hud.showPrompt(`${nearestGate.label.replace('\n', ' - ')}${starText} - Press ACTION`);
        if (input?.actionPressed) nearestGate.onEnter();
      }
    } else {
      this.hud.hidePrompt();
    }

    this.cameraRig.update(dt, [this.player.position], this.collisionMeshes);
  }

  render(renderer) {
    renderer.render(this.threeScene, this.camera);
  }

  dispose() {
    this.hud?.dispose();
    this.dialogueBox?.dispose();
  }
}
