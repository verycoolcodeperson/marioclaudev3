import * as THREE from 'three';
import { distance2D } from '../core/Collision.js';

// ---------------------------------------------------------------------------
// Pooled ballistic projectiles shared by every shooting enemy and boss
// (fireballs, spiny eggs, thrown hammers, boss orbs). No terrain collision
// - they just arc under gravity for a short lifetime and are checked
// against player positions each frame. Kept deliberately simple.
// ---------------------------------------------------------------------------

const geoCache = {
  fireball: new THREE.SphereGeometry(0.22, 8, 6),
  egg: new THREE.SphereGeometry(0.2, 8, 6),
  hammer: new THREE.BoxGeometry(0.16, 0.4, 0.12),
  rock: new THREE.DodecahedronGeometry(0.28, 0),
  orb: new THREE.SphereGeometry(0.3, 10, 8),
};
const matCache = {
  fireball: new THREE.MeshStandardMaterial({ color: 0xff5a1f, emissive: 0xff2200, emissiveIntensity: 0.6 }),
  egg: new THREE.MeshLambertMaterial({ color: 0xd8d8d8 }),
  hammer: new THREE.MeshLambertMaterial({ color: 0x8b5a2b }),
  rock: new THREE.MeshLambertMaterial({ color: 0x6b6b6b }),
  orb: new THREE.MeshStandardMaterial({ color: 0x9d4edd, emissive: 0x5a189a, emissiveIntensity: 0.6 }),
};

const POOL_SIZE = 24;

export class ProjectileSystem {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(geoCache.fireball, matCache.fireball);
      mesh.visible = false;
      mesh.castShadow = true;
      scene.add(mesh);
      this.pool.push({ mesh, active: false, vel: new THREE.Vector3(), life: 0, maxLife: 3, gravity: -14, damage: 1, radius: 0.4, owner: 'enemy' });
    }
    this.cursor = 0;
  }

  spawn({ x, y, z, vx, vy, vz, gravity = -14, life = 3, type = 'fireball', damage = 1, owner = 'enemy', radius = 0.42 }) {
    this.cursor = (this.cursor + 1) % POOL_SIZE;
    const p = this.pool[this.cursor];
    p.active = true;
    p.life = 0;
    p.maxLife = life;
    p.gravity = gravity;
    p.damage = damage;
    p.owner = owner;
    p.radius = radius;
    p.vel.set(vx, vy, vz);
    p.mesh.geometry = geoCache[type] || geoCache.fireball;
    p.mesh.material = matCache[type] || matCache.fireball;
    p.mesh.position.set(x, y, z);
    p.mesh.visible = true;
    return p;
  }

  update(dt, players, onHitPlayer) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife || p.mesh.position.y < -20) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.vel.y += p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.y += dt * 4;

      if (p.owner !== 'enemy') continue;
      for (const player of players) {
        if (!player || player.dead || player.invulnTimer > 0) continue;
        const d2 = distance2D(p.mesh.position.x, p.mesh.position.z, player.position.x, player.position.z);
        if (d2 < p.radius + player.radius && Math.abs(p.mesh.position.y - (player.position.y + 0.8)) < 1.2) {
          onHitPlayer(player, p);
          p.active = false;
          p.mesh.visible = false;
          break;
        }
      }
    }
  }
}
