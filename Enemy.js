import * as THREE from 'three';
import { sampleGround, distance2D } from '../core/Collision.js';
import { SFX } from '../core/Audio.js';
import { clamp } from '../utils/math.js';

// ---------------------------------------------------------------------------
// A single lightweight Enemy class drives every classic-Mario-style enemy
// in the game. Each enemy TYPE just picks a `behavior` (one of six shared,
// cheap AI routines) and a `build` (one of a handful of reused low-poly
// meshes). This keeps 10+ distinct-feeling enemies without 10 different AI
// systems - exactly the "extremely lightweight AI, reuse assets" brief.
// ---------------------------------------------------------------------------

export const ENEMY_TYPES = {
  goomba: { behavior: 'patrol', build: 'blob', color: 0x8b5a2b, health: 1, speed: 1.5, stompable: true, range: 2.6, touchDamage: 1 },
  buzzy: { behavior: 'patrol', build: 'blob', color: 0x3a6a5a, health: 1, speed: 1.3, stompable: true, range: 2.4, touchDamage: 1 },
  bobomb: { behavior: 'patrol', build: 'blob', color: 0x2b2b2b, health: 1, speed: 1.4, stompable: true, range: 2.2, touchDamage: 1, explodes: true },
  koopa: { behavior: 'chase', build: 'shell', color: 0x3fae4a, health: 1, speed: 1.6, stompable: true, aggro: 6.5, touchDamage: 1 },
  boo: { behavior: 'chase', build: 'ghost', color: 0xf4f4f4, health: 1, speed: 1.4, stompable: true, aggro: 7.5, touchDamage: 1 },
  piranha: { behavior: 'shoot', build: 'plant', color: 0x2fae4a, health: 2, speed: 0, stompable: false, range: 9, touchDamage: 1, shootInterval: 2.4 },
  hammerbro: { behavior: 'shoot', build: 'brother', color: 0x3fae4a, health: 2, speed: 0, stompable: true, range: 10, touchDamage: 1, shootInterval: 1.8 },
  paragoomba: { behavior: 'fly', build: 'flyer', color: 0x8b5a2b, health: 1, speed: 1.8, stompable: true, touchDamage: 1 },
  cheep: { behavior: 'fly', build: 'fish', color: 0xff6a4a, health: 1, speed: 2.2, stompable: true, touchDamage: 1 },
  lakitu: { behavior: 'flyshoot', build: 'cloudrider', color: 0xffe066, health: 2, speed: 1.2, stompable: false, touchDamage: 1, shootInterval: 2.6 },
  spiny: { behavior: 'patrol', build: 'spikyshell', color: 0xd6402a, health: 1, speed: 1.2, stompable: false, spiky: true, range: 2.2, touchDamage: 1 },
  chomp: { behavior: 'heavy', build: 'heavy', color: 0x2b2b2b, health: 3, speed: 0.9, stompable: true, aggro: 5.5, touchDamage: 2 },
  spiketop: { behavior: 'heavy', build: 'heavy', color: 0xd6402a, health: 3, speed: 0.8, stompable: false, spiky: true, aggro: 5, touchDamage: 2 },
};

// ---- shared cached geometry / materials -----------------------------------
const geo = {
  bodySphere: new THREE.SphereGeometry(0.42, 12, 10),
  footBox: new THREE.BoxGeometry(0.22, 0.16, 0.26),
  eyeWhite: new THREE.SphereGeometry(0.11, 8, 6),
  eyePupil: new THREE.SphereGeometry(0.055, 6, 6),
  browBox: new THREE.BoxGeometry(0.19, 0.05, 0.05),
  fang: new THREE.ConeGeometry(0.045, 0.1, 5),
  shellDome: new THREE.SphereGeometry(0.4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.7),
  spike: new THREE.ConeGeometry(0.09, 0.22, 6),
  wing: new THREE.ConeGeometry(0.05, 0.4, 4),
  pipeBase: new THREE.CylinderGeometry(0.5, 0.5, 0.6, 12),
  stem: new THREE.CylinderGeometry(0.14, 0.16, 0.6, 8),
  headBox: new THREE.BoxGeometry(0.5, 0.5, 0.55),
  tooth: new THREE.ConeGeometry(0.05, 0.12, 4),
  fuse: new THREE.CylinderGeometry(0.03, 0.03, 0.2, 5),
  cloud: new THREE.SphereGeometry(0.45, 8, 6),
  bootBox: new THREE.BoxGeometry(0.34, 0.24, 0.4),
};
const matCache = new Map();
function mat(color, opts = {}) {
  const key = `${color}_${JSON.stringify(opts)}`;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return matCache.get(key);
}

// Bigger eyes + steeply angled "angry" brows read far more clearly at a
// distance than a subtle look - this is the single biggest lever for
// making a low-poly enemy feel expressive instead of a plain blob.
function eyes(parent, spread = 0.16, y = 0.08, z = 0.35) {
  for (const side of [-1, 1]) {
    const white = new THREE.Mesh(geo.eyeWhite, mat(0xffffff));
    white.scale.set(1, 1.15, 0.7);
    white.position.set(side * spread, y, z);
    parent.add(white);
    const pupil = new THREE.Mesh(geo.eyePupil, mat(0x1a1a1a));
    pupil.position.set(side * spread - side * 0.02, y - 0.015, z + 0.07);
    parent.add(pupil);
    const brow = new THREE.Mesh(geo.browBox, mat(0x2b2015));
    brow.position.set(side * spread + side * 0.01, y + 0.14, z - 0.01);
    brow.rotation.z = side * 0.5;
    parent.add(brow);
  }
}

/** Two small fangs beneath the eyes - the other big Goomba/blob identifier. */
function fangs(parent, spread = 0.09, y = -0.05, z = 0.38) {
  for (const side of [-1, 1]) {
    const fang = new THREE.Mesh(geo.fang, mat(0xfff6e0));
    fang.position.set(side * spread, y, z);
    fang.rotation.x = Math.PI;
    parent.add(fang);
  }
}

function buildBlob(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo.bodySphere, mat(color));
  body.scale.set(1.2, 0.88, 1.05);
  body.position.y = 0.4;
  body.castShadow = true;
  g.add(body);
  eyes(body, 0.16, 0.1, 0.36);
  fangs(body, 0.1, -0.08, 0.4);
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(geo.footBox, mat(0x3a2415));
    foot.position.set(side * 0.21, 0.09, 0.02);
    foot.castShadow = true;
    g.add(foot);
  }
  return { group: g, bodyHeight: 0.85, legParts: null };
}

function buildBobomb(color) {
  const built = buildBlob(color);
  const fuse = new THREE.Mesh(geo.fuse, mat(0xe8c88a));
  fuse.position.set(0, 0.85, 0);
  fuse.rotation.z = 0.4;
  built.group.add(fuse);
  return built;
}

function buildShell(color) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(geo.shellDome, mat(color));
  shell.position.y = 0.55;
  shell.castShadow = true;
  g.add(shell);
  // A darker rim band around the shell's base breaks up the plain dome so
  // it reads as an actual shell rather than a solid-colored ball.
  const rim = new THREE.Mesh(geo.shellDome, mat(0x2b7a3a));
  rim.scale.set(1.04, 0.22, 1.04);
  rim.position.y = 0.4;
  g.add(rim);
  const head = new THREE.Mesh(geo.bodySphere, mat(0xffc89b));
  head.scale.set(0.55, 0.52, 0.6);
  head.position.set(0, 0.65, 0.32);
  g.add(head);
  eyes(head, 0.13, 0.03, 0.28);
  // Small beak - a Koopa's most identifying head feature besides the shell.
  const beak = new THREE.Mesh(geo.fang, mat(0xffaa33));
  beak.scale.set(1.7, 1.2, 1.7);
  beak.position.set(0, -0.06, 0.42);
  beak.rotation.x = Math.PI * 0.56;
  head.add(beak);
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(geo.bootBox, mat(0xffcc33));
    foot.scale.setScalar(0.55);
    foot.position.set(side * 0.22, 0.14, 0);
    g.add(foot);
  }
  return { group: g, bodyHeight: 0.9 };
}

function buildSpikyShell(color) {
  const built = buildShell(color);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(geo.spike, mat(0xffe066));
    spike.position.set(Math.cos(a) * 0.28, 0.82, Math.sin(a) * 0.28 + 0.1);
    spike.rotation.x = Math.PI / 2 - 0.4;
    built.group.add(spike);
  }
  return built;
}

function buildGhost(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo.bodySphere, mat(color, { transparent: true, opacity: 0.88 }));
  body.scale.set(1.1, 1.2, 1);
  body.position.y = 0.55;
  g.add(body);
  eyes(body, 0.15, 0.1, 0.36);
  // The round, startled "O" mouth is Boo's signature expression.
  const mouth = new THREE.Mesh(geo.eyePupil, mat(0x2b2015));
  mouth.scale.set(1.9, 1.6, 1);
  mouth.position.set(0, -0.08, 0.4);
  body.add(mouth);
  return { group: g, bodyHeight: 1.1 };
}

function buildPlant(color) {
  const g = new THREE.Group();
  const pipe = new THREE.Mesh(geo.pipeBase, mat(0x2fae4a === color ? 0x2f8a3a : 0x555555));
  pipe.position.y = 0.3;
  pipe.castShadow = true;
  g.add(pipe);
  const stem = new THREE.Mesh(geo.stem, mat(color));
  stem.position.y = 0.9;
  stem.castShadow = true;
  g.add(stem);
  const head = new THREE.Mesh(geo.headBox, mat(0xd6402a));
  head.position.y = 1.35;
  head.castShadow = true;
  g.add(head);
  eyes(head, 0.13, 0.08, 0.29);
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(geo.tooth, mat(0xffffff));
    t.position.set((i % 2 === 0 ? -1 : 1) * 0.15, 1.15, 0.24);
    t.rotation.x = Math.PI;
    g.add(t);
  }
  return { group: g, bodyHeight: 1.6, headOffset: 1.35 };
}

function buildBrother(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo.bodySphere, mat(color));
  body.scale.set(0.9, 1.1, 0.9);
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(geo.bodySphere, mat(0xffc89b));
  head.scale.setScalar(0.5);
  head.position.y = 1.1;
  g.add(head);
  eyes(head, 0.12, 0.05, 0.26);
  const hammer = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), mat(0x8b5a2b));
  handle.position.set(0.45, 0.7, 0);
  handle.rotation.z = 0.3;
  const head2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.15), mat(0x6b6b6b));
  head2.position.set(0.55, 0.85, 0);
  hammer.add(handle, head2);
  g.add(hammer);
  return { group: g, bodyHeight: 1.1, hammer };
}

function buildFlyer(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo.bodySphere, mat(color));
  body.scale.set(1.1, 0.85, 1);
  body.castShadow = true;
  g.add(body);
  eyes(body, 0.14, 0.1, 0.34);
  const wings = new THREE.Group();
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(geo.wing, mat(0xffffff, { transparent: true, opacity: 0.85 }));
    wing.rotation.z = side * 1.1;
    wing.position.set(side * 0.4, 0.15, 0);
    wings.add(wing);
  }
  g.add(wings);
  return { group: g, bodyHeight: 0.8, wings };
}

function buildFish(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo.bodySphere, mat(color));
  body.scale.set(1.3, 0.7, 0.7);
  body.castShadow = true;
  g.add(body);
  eyes(body, 0.1, 0.08, 0.28);
  const tail = new THREE.Mesh(geo.wing, mat(color));
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.45, 0, 0);
  g.add(tail);
  return { group: g, bodyHeight: 0.6 };
}

function buildCloudrider(color) {
  const g = new THREE.Group();
  const cloud = new THREE.Mesh(geo.cloud, mat(0xffffff));
  cloud.scale.set(1.3, 0.5, 1.1);
  cloud.castShadow = true;
  g.add(cloud);
  const body = new THREE.Mesh(geo.bodySphere, mat(color));
  body.scale.set(0.75, 0.85, 0.75);
  body.position.y = 0.45;
  body.castShadow = true;
  g.add(body);
  eyes(body, 0.13, 0.08, 0.3);
  return { group: g, bodyHeight: 1.0 };
}

export function buildHeavy(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo.bodySphere, mat(color));
  body.scale.setScalar(1.6);
  body.position.y = 0.7;
  body.castShadow = true;
  g.add(body);
  eyes(body, 0.24, 0.15, 0.58);
  fangs(body, 0.15, -0.05, 0.62);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(geo.spike, mat(0xffe066));
    spike.scale.setScalar(1.3);
    spike.position.set(Math.cos(a) * 0.55, 0.7 + Math.sin(a) * 0.2, Math.sin(a) * 0.55);
    spike.lookAt(spike.position.clone().multiplyScalar(2));
    spike.rotateX(Math.PI / 2);
    g.add(spike);
  }
  return { group: g, bodyHeight: 1.4 };
}

const BUILDERS = {
  blob: buildBlob,
  shell: buildShell,
  spikyshell: buildSpikyShell,
  ghost: buildGhost,
  plant: buildPlant,
  brother: buildBrother,
  flyer: buildFlyer,
  fish: buildFish,
  cloudrider: buildCloudrider,
  heavy: buildHeavy,
};
function buildEnemyMesh(build, color) {
  const fn = BUILDERS[build] || buildBlob;
  return fn(color);
}

// ---------------------------------------------------------------------------
export class Enemy {
  constructor(typeKey, spec, projectileSystem) {
    this.typeKey = typeKey;
    this.config = ENEMY_TYPES[typeKey] || ENEMY_TYPES.goomba;
    this.id = spec.id || null;
    this.origin = { x: spec.x, y: spec.y, z: spec.z };
    this.position = new THREE.Vector3(spec.x, spec.y, spec.z);
    this.velocity = new THREE.Vector3();
    this.range = spec.range ?? this.config.range ?? 2.5;
    this.health = this.config.health;
    this.alive = true;
    this.dying = false;
    this.deathTimer = 0;
    this.finished = false;
    this.hitFlashTimer = 0;
    this.projectileSystem = projectileSystem;
    this.shootTimer = Math.random() * (this.config.shootInterval || 2);
    this.dir = Math.random() > 0.5 ? 1 : -1;
    this.phase = Math.random() * Math.PI * 2;
    this.lungeTimer = 0;
    this.lungeCooldown = 0;

    const built = buildEnemyMesh(this.config.build, this.config.color);
    this.group = built.group;
    this.bodyHeight = built.bodyHeight;
    this.built = built;
    this.group.position.copy(this.position);
    this.radius = 0.5;

    // Materials are cached/shared by color for memory efficiency, but hit-flash
    // is per-instance - clone this enemy's materials so flashing one Goomba
    // doesn't flash every other Goomba sharing the same cached material.
    const cloneMap = new Map();
    this.group.traverse((o) => {
      if (o.isMesh && o.material) {
        if (!cloneMap.has(o.material)) cloneMap.set(o.material, o.material.clone());
        o.material = cloneMap.get(o.material);
      }
    });
  }

  takeHit(fromStomp = false) {
    if (!this.alive || this.dying) return;
    this.health -= 1;
    this.hitFlashTimer = 0.15;
    if (this.health <= 0) {
      this.alive = false;
      this.dying = true;
      this.deathTimer = 0;
      SFX.play(fromStomp ? 'stomp' : 'hit');
    } else {
      SFX.play('hit');
    }
  }

  update(dt, t, players, colliders) {
    if (this.dying) {
      this.deathTimer += dt;
      const s = Math.max(0, 1 - this.deathTimer / 0.35);
      this.group.scale.set(s * 1.3, s * 0.3, s * 1.3);
      this.group.position.y = this.position.y - (1 - s) * 0.3;
      if (this.deathTimer >= 0.35) this.finished = true;
      return;
    }
    if (!this.alive) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    const nearestPlayer = this._nearestPlayer(players);

    switch (this.config.behavior) {
      case 'patrol': this._patrol(dt, colliders); break;
      case 'chase': this._chase(dt, colliders, nearestPlayer); break;
      case 'shoot': this._shoot(dt, t, nearestPlayer); break;
      case 'fly': this._fly(dt, t); break;
      case 'flyshoot': this._flyshoot(dt, t, nearestPlayer); break;
      case 'heavy': this._heavy(dt, colliders, nearestPlayer); break;
      default: break;
    }

    this.group.position.copy(this.position);
    const flashT = this.hitFlashTimer > 0 ? this.hitFlashTimer / 0.15 : 0;
    this.group.traverse((o) => { if (o.material?.emissive) o.material.emissive.setScalar(flashT); });
  }

  _nearestPlayer(players) {
    let best = null, bestD = Infinity;
    for (const p of players) {
      if (!p || p.dead) continue;
      const d = distance2D(this.position.x, this.position.z, p.position.x, p.position.z);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best ? { player: best, dist: bestD } : null;
  }

  _applyGravity(dt, colliders) {
    this.velocity.y += -28 * dt;
    let ny = this.position.y + this.velocity.y * dt;
    const ground = sampleGround(this.position.x, this.position.z, ny + 0.4, colliders);
    if (ground && ny <= ground.maxY + 0.4 && this.velocity.y <= 0) {
      ny = ground.maxY;
      this.velocity.y = 0;
    }
    this.position.y = ny;
  }

  _patrol(dt, colliders) {
    const speed = this.config.speed;
    this.position.x += this.dir * speed * dt;
    const dx = this.position.x - this.origin.x;
    if (Math.abs(dx) > this.range) {
      this.position.x = this.origin.x + Math.sign(dx) * this.range;
      this.dir *= -1;
    }
    this.group.rotation.y = this.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    this._applyGravity(dt, colliders);
    this._bobWalk(dt);
  }

  _chase(dt, colliders, nearest) {
    const aggro = this.config.aggro || 6;
    if (nearest && nearest.dist < aggro) {
      const dx = nearest.player.position.x - this.position.x;
      const dz = nearest.player.position.z - this.position.z;
      const len = Math.hypot(dx, dz) || 1;
      this.position.x += (dx / len) * this.config.speed * dt;
      this.position.z += (dz / len) * this.config.speed * dt;
      this.group.rotation.y = Math.atan2(dx, dz);
    } else {
      this._patrol(dt, colliders);
      return;
    }
    this._applyGravity(dt, colliders);
    this._bobWalk(dt);
  }

  _shoot(dt, t, nearest) {
    this.group.position.y = this.origin.y + (this.built.headOffset ? Math.sin(t * 1.5) * 0.05 : 0);
    this.position.y = this.origin.y;
    if (this.built.hammer) this.built.hammer.rotation.z = Math.sin(t * 6) * 1.2;
    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && nearest && nearest.dist < (this.config.range || 9)) {
      this.shootTimer = this.config.shootInterval || 2;
      const dx = nearest.player.position.x - this.position.x;
      const dz = nearest.player.position.z - this.position.z;
      const dist = Math.hypot(dx, dz) || 1;
      const speed = 6;
      const isHammer = this.config.build === 'brother';
      this.projectileSystem.spawn({
        x: this.position.x, y: this.position.y + (this.bodyHeight || 1) * 0.7, z: this.position.z,
        vx: (dx / dist) * speed, vy: 5, vz: (dz / dist) * speed,
        type: isHammer ? 'hammer' : 'fireball', gravity: -14, life: 2.4, damage: 1,
      });
      SFX.play('hit');
    }
  }

  _fly(dt, t) {
    this.phase += dt * this.config.speed;
    this.position.x = this.origin.x + Math.sin(this.phase) * 2.4;
    this.position.z = this.origin.z + Math.cos(this.phase * 0.6) * 1.2;
    this.position.y = this.origin.y + Math.sin(t * 2 + this.phase) * 0.3;
    this.group.rotation.y = this.phase;
    if (this.built.wings) this.built.wings.rotation.x = Math.sin(t * 14) * 0.5;
  }

  _flyshoot(dt, t, nearest) {
    if (nearest) {
      const dx = nearest.player.position.x - this.position.x;
      const dz = nearest.player.position.z - this.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 3) {
        this.position.x += (dx / dist) * this.config.speed * dt;
        this.position.z += (dz / dist) * this.config.speed * dt;
      }
      this.position.y = nearest.player.position.y + 3.5 + Math.sin(t * 1.4) * 0.2;
    }
    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && nearest && nearest.dist < 9) {
      this.shootTimer = this.config.shootInterval || 2.6;
      this.projectileSystem.spawn({
        x: this.position.x, y: this.position.y - 0.4, z: this.position.z,
        vx: 0, vy: -2, vz: 0, type: 'egg', gravity: -10, life: 2, damage: 1,
      });
    }
  }

  _heavy(dt, colliders, nearest) {
    const aggro = this.config.aggro || 5;
    if (this.lungeCooldown > 0) this.lungeCooldown -= dt;
    if (nearest && nearest.dist < aggro) {
      const dx = nearest.player.position.x - this.position.x;
      const dz = nearest.player.position.z - this.position.z;
      const len = Math.hypot(dx, dz) || 1;
      const speed = nearest.dist < 2.6 && this.lungeCooldown <= 0 ? this.config.speed * 2.6 : this.config.speed;
      if (nearest.dist < 2.6 && this.lungeCooldown <= 0) this.lungeCooldown = 1.4;
      this.position.x += (dx / len) * speed * dt;
      this.position.z += (dz / len) * speed * dt;
      this.group.rotation.y = Math.atan2(dx, dz);
    } else {
      this._patrol(dt, colliders);
      return;
    }
    this._applyGravity(dt, colliders);
    this._bobWalk(dt, 6);
  }

  _bobWalk(dt, freq = 8) {
    this._walkT = (this._walkT || 0) + dt * freq;
    this.group.rotation.z = Math.sin(this._walkT) * 0.06;
  }
}
