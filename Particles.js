import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Minimal pooled particle system. A fixed number of small cube meshes are
// reused for every burst effect in the game (stomp dust, coin sparkle,
// ground-pound shockwave dust, star sparkle) - never allocates meshes at
// runtime, keeping this cheap even with frequent effects.
// ---------------------------------------------------------------------------

const POOL_SIZE = 48;
const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.frustumCulled = true;
      scene.add(mesh);
      this.pool.push({ mesh, vel: new THREE.Vector3(), life: 0, maxLife: 1, active: false });
    }
    this.cursor = 0;

    // Reusable expanding rings for shockwaves (ground pound / boss slams).
    this.rings = [];
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.5, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.visible = false;
      scene.add(ring);
      this.rings.push({ mesh: ring, life: 0, maxLife: 0.5, active: false });
    }
    this.ringCursor = 0;
  }

  _nextParticle() {
    this.cursor = (this.cursor + 1) % POOL_SIZE;
    return this.pool[this.cursor];
  }

  burst(x, y, z, color = 0xffffff, count = 8, spread = 2.5) {
    for (let i = 0; i < count; i++) {
      const p = this._nextParticle();
      p.active = true;
      p.life = 0;
      p.maxLife = 0.4 + Math.random() * 0.35;
      p.mesh.position.set(x, y, z);
      p.mesh.scale.setScalar(0.6 + Math.random() * 0.8);
      p.mesh.material.color.set(color);
      p.mesh.material.opacity = 1;
      p.mesh.visible = true;
      const angle = Math.random() * Math.PI * 2;
      const speed = spread * (0.4 + Math.random() * 0.6);
      p.vel.set(Math.cos(angle) * speed, Math.random() * 4 + 1.5, Math.sin(angle) * speed);
    }
  }

  ring(x, y, z, color = 0xffe066) {
    this.ringCursor = (this.ringCursor + 1) % this.rings.length;
    const r = this.rings[this.ringCursor];
    r.active = true;
    r.life = 0;
    r.mesh.position.set(x, y + 0.05, z);
    r.mesh.scale.setScalar(0.2);
    r.mesh.material.color.set(color);
    r.mesh.material.opacity = 0.7;
    r.mesh.visible = true;
  }

  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.vel.y -= 9 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.material.opacity = 1 - p.life / p.maxLife;
      p.mesh.rotation.x += dt * 5;
      p.mesh.rotation.y += dt * 4;
    }
    for (const r of this.rings) {
      if (!r.active) continue;
      r.life += dt;
      if (r.life >= r.maxLife) {
        r.active = false;
        r.mesh.visible = false;
        continue;
      }
      const t = r.life / r.maxLife;
      r.mesh.scale.setScalar(0.2 + t * 6);
      r.mesh.material.opacity = 0.7 * (1 - t);
    }
  }
}
