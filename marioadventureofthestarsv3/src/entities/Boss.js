import * as THREE from 'three';
import { buildHeavy } from './Enemy.js';
import { distance2D } from '../core/Collision.js';
import { SFX } from '../core/Audio.js';
import { clamp } from '../utils/math.js';

// ---------------------------------------------------------------------------
// Reusable boss framework. Every boss is: enter -> run an attack pattern
// (a short scripted sequence of shared "moves") -> become vulnerable ->
// take hits -> advance phase (new/faster pattern) -> repeat -> defeated.
// Individual bosses only supply a config (name, color, decoration, which
// moves to use per phase) - see levels/bosses.js for the 8 configs.
// ---------------------------------------------------------------------------

const geo = {
  horn: new THREE.ConeGeometry(0.12, 0.5, 6),
  crownSpike: new THREE.ConeGeometry(0.1, 0.3, 5),
  wingSail: new THREE.ConeGeometry(0.06, 0.9, 4),
  shellDome: new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.7),
  eyeWhite: new THREE.SphereGeometry(0.14, 8, 6),
  eyePupil: new THREE.SphereGeometry(0.07, 6, 6),
};
const matCache = new Map();
function mat(color, opts = {}) {
  const key = `${color}_${JSON.stringify(opts)}`;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return matCache.get(key);
}

function decorate(group, decoration, color) {
  switch (decoration) {
    case 'horns':
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(geo.horn, mat(0xffffff));
        horn.position.set(side * 0.45, 1.55, 0.3);
        horn.rotation.z = side * 0.5;
        horn.rotation.x = -0.3;
        group.add(horn);
      }
      break;
    case 'crown':
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const s = new THREE.Mesh(geo.crownSpike, mat(0xffe066));
        s.position.set(Math.cos(a) * 0.5, 1.7, Math.sin(a) * 0.5);
        group.add(s);
      }
      break;
    case 'shell':
      { const shell = new THREE.Mesh(geo.shellDome, mat(0x2f8a3a));
        shell.scale.set(1, 0.8, 0.8);
        shell.position.set(0, 1.0, -0.5);
        group.add(shell); }
      break;
    case 'wings':
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(geo.wingSail, mat(0xffffff, { transparent: true, opacity: 0.85 }));
        wing.rotation.z = side * 1.15;
        wing.position.set(side * 0.85, 1.1, -0.2);
        group.add(wing);
      }
      break;
    case 'icecrown':
      for (let i = 0; i < 4; i++) {
        const s = new THREE.Mesh(geo.crownSpike, mat(0xdff2ff));
        s.position.set((i - 1.5) * 0.28, 1.75, 0.15);
        group.add(s);
      }
      break;
    default: break;
  }
}

export class Boss {
  constructor(config, spec, projectileSystem) {
    this.config = config;
    this.name = config.name;
    this.position = new THREE.Vector3(spec.x, spec.y, spec.z);
    this.arenaCenter = { x: spec.x, y: spec.y, z: spec.z };
    this.arenaRadius = config.arenaRadius || 10;
    this.projectileSystem = projectileSystem;

    const built = buildHeavy(config.color);
    this.group = built.group;
    this.group.scale.setScalar(config.scale || 1.7);
    decorate(this.group, config.decoration, config.color);
    this.group.position.copy(this.position);

    // Clone materials per-instance so this boss's hit-flash/vulnerable glow
    // never bleeds onto other enemies/bosses sharing the same cached color.
    const cloneMap = new Map();
    this.group.traverse((o) => {
      if (o.isMesh && o.material) {
        if (!cloneMap.has(o.material)) cloneMap.set(o.material, o.material.clone());
        o.material = cloneMap.get(o.material);
      }
    });
    this.baseMaterial = built.group.children[0].material;

    this.radius = 1.1 * (config.scale || 1.7);
    this.touchDamage = 1;

    this.phase = 1;
    this.maxPhase = config.phases || 2;
    this.hitsTaken = 0;
    this.hitsPerPhase = config.hitsPerPhase || 3;
    this.state = 'enter';
    this.stateTimer = 0;
    this.moveIndex = 0;
    this.moveTimer = 0;
    this.currentMove = null;
    this.vulnerable = false;
    this.defeated = false;
    this.finished = false;
    this.hitFlash = 0;
    this.spawnEnemyFn = null; // set by Level

    this.velocity = new THREE.Vector3();
    this.chargeDir = new THREE.Vector3();
    this.homeY = spec.y;
  }

  _moves() {
    return this.config.phaseMoves?.[this.phase] || this.config.moves || ['groundSlam', 'projectile'];
  }

  takeHit() {
    if (!this.vulnerable || this.defeated) return;
    this.hitsTaken += 1;
    this.hitFlash = 0.2;
    SFX.play('bossHit');
    if (this.hitsTaken >= this.hitsPerPhase) {
      this.phase += 1;
      this.hitsTaken = 0;
      if (this.phase > this.maxPhase) {
        this._defeat();
      } else {
        this.state = 'phaseTransition';
        this.stateTimer = 0;
        this.vulnerable = false;
      }
    }
  }

  _defeat() {
    this.defeated = true;
    this.vulnerable = false;
    this.state = 'defeated';
    this.stateTimer = 0;
    SFX.play('bossDefeat');
  }

  update(dt, t, players, colliders, particleSystem) {
    if (this.hitFlash > 0) this.hitFlash -= dt;
    const nearest = this._nearest(players);

    if (this.state === 'defeated') {
      this.stateTimer += dt;
      const s = Math.max(0, 1 - this.stateTimer / 1.4);
      this.group.scale.setScalar((this.config.scale || 1.7) * s);
      this.group.rotation.y += dt * 6;
      this.group.position.y = this.position.y + (1 - s) * -1.5;
      if (this.stateTimer > 0.2 && Math.floor(this.stateTimer * 12) % 2 === 0) {
        particleSystem?.burst(this.position.x, this.position.y + 1, this.position.z, this.config.color, 3, 3);
      }
      if (this.stateTimer >= 1.4) this.finished = true;
      this.group.position.x = this.position.x;
      this.group.position.z = this.position.z;
      return;
    }

    if (this.state === 'enter') {
      this.stateTimer += dt;
      const dropT = clamp(this.stateTimer / 1.0, 0, 1);
      this.group.position.y = this.position.y + (1 - dropT) * 8;
      this.group.scale.setScalar((this.config.scale || 1.7) * (0.6 + 0.4 * dropT));
      if (this.stateTimer >= 1.0) {
        this.state = 'attackPattern';
        this.stateTimer = 0;
        this.moveIndex = 0;
        this.moveTimer = 0;
        this.currentMove = null;
        particleSystem?.ring(this.position.x, this.position.y, this.position.z, this.config.color);
      }
      return;
    }

    if (this.state === 'phaseTransition') {
      this.stateTimer += dt;
      this.group.rotation.y += dt * 10;
      const pulse = 1 + Math.sin(this.stateTimer * 20) * 0.08;
      this.group.scale.setScalar((this.config.scale || 1.7) * pulse);
      if (this.stateTimer >= 1.1) {
        this.state = 'attackPattern';
        this.stateTimer = 0;
        this.moveIndex = 0;
        this.moveTimer = 0;
        this.currentMove = null;
        this.group.scale.setScalar(this.config.scale || 1.7);
        particleSystem?.ring(this.position.x, this.position.y, this.position.z, 0xffffff);
      }
      return;
    }

    if (this.state === 'vulnerable') {
      this.stateTimer += dt;
      this.vulnerable = true;
      this.group.position.y = this.position.y + Math.sin(this.stateTimer * 10) * 0.06;
      const flash = 0.4 + Math.sin(this.stateTimer * 12) * 0.3;
      if (this.baseMaterial?.emissive) this.baseMaterial.emissive.setScalar(flash);
      if (this.stateTimer >= (this.config.vulnerableDuration || 3.2)) {
        this.vulnerable = false;
        this.state = 'attackPattern';
        this.stateTimer = 0;
        this.moveIndex = 0;
        this.moveTimer = 0;
        this.currentMove = null;
      }
      return;
    }

    // attackPattern
    const moves = this._moves();
    if (!this.currentMove) {
      this.currentMove = moves[this.moveIndex % moves.length];
      this.moveTimer = 0;
      this._startMove(this.currentMove, nearest);
    }
    this.moveTimer += dt;
    const done = this._runMove(this.currentMove, dt, t, nearest, particleSystem);
    if (done) {
      this.moveIndex += 1;
      this.currentMove = null;
      if (this.moveIndex >= moves.length * (this.config.cyclesPerVuln || 1)) {
        this.moveIndex = 0;
        this.state = 'vulnerable';
        this.stateTimer = 0;
      }
    }

    this.group.position.copy(this.position);
    if (this.baseMaterial?.emissive) {
      this.baseMaterial.emissive.setScalar(this.hitFlash > 0 ? 0.8 : 0);
    }
  }

  _nearest(players) {
    let best = null, bestD = Infinity;
    for (const p of players) {
      if (!p || p.dead) continue;
      const d = distance2D(this.position.x, this.position.z, p.position.x, p.position.z);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  _startMove(move, target) {
    const speedMul = 1 + (this.phase - 1) * 0.35;
    this._moveSpeedMul = speedMul;
    this._shotFired = false;
    this._summoned = false;
    this._slamHitReady = false;
    if (move === 'charge' && target) {
      const dx = target.position.x - this.position.x;
      const dz = target.position.z - this.position.z;
      const len = Math.hypot(dx, dz) || 1;
      this.chargeDir.set(dx / len, 0, dz / len);
    }
    if (move === 'jumpAttack' && target) {
      this._jumpTargetX = target.position.x;
      this._jumpTargetZ = target.position.z;
      this._jumpStartX = this.position.x;
      this._jumpStartZ = this.position.z;
    }
  }

  _clampToArena() {
    const dx = this.position.x - this.arenaCenter.x;
    const dz = this.position.z - this.arenaCenter.z;
    const d = Math.hypot(dx, dz);
    if (d > this.arenaRadius) {
      const s = this.arenaRadius / d;
      this.position.x = this.arenaCenter.x + dx * s;
      this.position.z = this.arenaCenter.z + dz * s;
    }
  }

  _runMove(move, dt, t, target, particleSystem) {
    const dur = { groundSlam: 1.6, shockwave: 1.0, charge: 1.4, jumpAttack: 1.3, projectile: 1.2, summon: 1.0 }[move] || 1.2;
    const mt = this.moveTimer;
    switch (move) {
      case 'charge': {
        if (mt < 0.5) {
          this.group.rotation.y = Math.atan2(this.chargeDir.x, this.chargeDir.z);
          return false;
        }
        const speed = 9 * this._moveSpeedMul;
        this.position.x += this.chargeDir.x * speed * dt;
        this.position.z += this.chargeDir.z * speed * dt;
        this._clampToArena();
        return mt >= dur;
      }
      case 'groundSlam': {
        if (mt < 0.7) {
          this.group.position.y = this.position.y + (mt / 0.7) * 3.5;
        } else if (mt < 1.0) {
          const lt = (mt - 0.7) / 0.3;
          this.group.position.y = this.position.y + 3.5 * (1 - lt);
          if (mt + dt >= 1.0) {
            particleSystem?.ring(this.position.x, this.position.y, this.position.z, this.config.color);
            particleSystem?.burst(this.position.x, this.position.y, this.position.z, this.config.color, 10, 3.5);
            this._slamHitReady = true;
          }
        } else {
          this.group.position.y = this.position.y;
        }
        return mt >= dur;
      }
      case 'jumpAttack': {
        const lt = clamp(mt / dur, 0, 1);
        this.position.x = this._jumpStartX + (this._jumpTargetX - this._jumpStartX) * lt;
        this.position.z = this._jumpStartZ + (this._jumpTargetZ - this._jumpStartZ) * lt;
        this.group.position.y = this.position.y + Math.sin(lt * Math.PI) * 2.6;
        if (lt >= 0.98 && !this._slamHitReady) {
          particleSystem?.ring(this.position.x, this.position.y, this.position.z, this.config.color);
          this._slamHitReady = true;
        }
        return mt >= dur;
      }
      case 'shockwave': {
        if (mt < 0.3) this.group.scale.setScalar((this.config.scale || 1.7) * (1 + mt));
        else { this.group.scale.setScalar(this.config.scale || 1.7); if (!this._slamHitReady) { particleSystem?.ring(this.position.x, this.position.y, this.position.z, this.config.color); this._slamHitReady = true; } }
        return mt >= dur;
      }
      case 'projectile': {
        if (mt > 0.3 && !this._shotFired && target) {
          const dx = target.position.x - this.position.x, dz = target.position.z - this.position.z;
          const dist = Math.hypot(dx, dz) || 1;
          this.projectileSystem.spawn({
            x: this.position.x, y: this.position.y + 1.6, z: this.position.z,
            vx: (dx / dist) * 7, vy: 5.5, vz: (dz / dist) * 7,
            type: this.config.projectileType || 'fireball', life: 2.6, damage: 1, gravity: -13,
          });
          this._shotFired = true;
        }
        return mt >= dur;
      }
      case 'summon': {
        if (mt > 0.4 && !this._summoned && this.spawnEnemyFn) {
          const count = this.config.summonCount || 2;
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + t;
            this.spawnEnemyFn(this.config.summonType || 'goomba', this.arenaCenter.x + Math.cos(a) * (this.arenaRadius * 0.7), this.position.y, this.arenaCenter.z + Math.sin(a) * (this.arenaRadius * 0.7));
          }
          this._summoned = true;
        }
        return mt >= dur;
      }
      default:
        return true;
    }
  }

  /** Returns true exactly once, on the frame a slam/shockwave impact should deal damage. */
  consumeSlamHit() {
    if (this._slamHitReady) { this._slamHitReady = false; return true; }
    return false;
  }
}
