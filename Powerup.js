import * as THREE from 'three';
import { distance2D, makeCollider } from '../core/Collision.js';
import { SFX } from '../core/Audio.js';

// ---------------------------------------------------------------------------
// The two collectible powerups, plus the brick blocks a Mega player smashes.
//
//   fireflower - swaps the grounded punch for a bouncing fireball
//   megashroom - doubles the player's size, lets them break bricks by
//                jumping into them, and soaks one hit without costing a life
//
// Both bob and spin in place and use the same cheap distance check as coins
// rather than a collider, since nothing needs to stand on them.
// ---------------------------------------------------------------------------

const geo = {
  petal: new THREE.SphereGeometry(0.16, 8, 6),
  core: new THREE.SphereGeometry(0.11, 8, 6),
  stem: new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6),
  leaf: new THREE.SphereGeometry(0.1, 6, 5),
  cap: new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  stalk: new THREE.CylinderGeometry(0.16, 0.19, 0.26, 10),
  spot: new THREE.CircleGeometry(0.078, 10),
  eye: new THREE.SphereGeometry(0.032, 6, 5),
  brick: new THREE.BoxGeometry(1, 1, 1),
};

const mats = {
  flowerPetal: new THREE.MeshLambertMaterial({ color: 0xff7a2f }),
  flowerCore: new THREE.MeshLambertMaterial({ color: 0xfff0a8 }),
  flowerStem: new THREE.MeshLambertMaterial({ color: 0x3fae4a }),
  capRed: new THREE.MeshLambertMaterial({ color: 0xe6302c }),
  capSpot: new THREE.MeshLambertMaterial({ color: 0xfff6e8, side: THREE.DoubleSide }),
  stalk: new THREE.MeshLambertMaterial({ color: 0xfff0d8 }),
  eye: new THREE.MeshLambertMaterial({ color: 0x2b2015 }),
};

function buildFireFlower() {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(geo.stem, mats.flowerStem);
  stem.position.y = 0.15;
  g.add(stem);
  for (const side of [-1, 1]) {
    const leaf = new THREE.Mesh(geo.leaf, mats.flowerStem);
    leaf.scale.set(1.5, 0.5, 1);
    leaf.position.set(side * 0.15, 0.14, 0);
    g.add(leaf);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const petal = new THREE.Mesh(geo.petal, mats.flowerPetal);
    petal.scale.set(1, 0.55, 1);
    petal.position.set(Math.cos(a) * 0.17, 0.42, Math.sin(a) * 0.17);
    g.add(petal);
  }
  const core = new THREE.Mesh(geo.core, mats.flowerCore);
  core.position.y = 0.44;
  g.add(core);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(geo.eye, mats.eye);
    eye.position.set(side * 0.05, 0.46, 0.1);
    g.add(eye);
  }
  return g;
}

function buildMegaMushroom() {
  const g = new THREE.Group();
  const stalk = new THREE.Mesh(geo.stalk, mats.stalk);
  stalk.position.y = 0.13;
  g.add(stalk);
  const cap = new THREE.Mesh(geo.cap, mats.capRed);
  cap.scale.set(1, 0.78, 1);
  cap.position.y = 0.25;
  g.add(cap);
  // Spots sit just off the dome surface, angled to lie flat against it.
  const spots = [[0, 0.5, 0.02], [0.62, 0.24, 0.9], [-0.62, 0.24, 0.9], [0.62, 0.24, -0.9], [-0.62, 0.24, -0.9]];
  for (const [sx, sy, sz] of spots) {
    const spot = new THREE.Mesh(geo.spot, mats.capSpot);
    const v = new THREE.Vector3(sx, sy, sz).normalize().multiplyScalar(0.305);
    spot.position.set(v.x, 0.25 + v.y * 0.78, v.z);
    spot.lookAt(spot.position.clone().add(v));
    g.add(spot);
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(geo.eye, mats.eye);
    eye.scale.set(1, 1.6, 1);
    eye.position.set(side * 0.07, 0.14, 0.17);
    g.add(eye);
  }
  return g;
}

const BUILDERS = { fire: buildFireFlower, mega: buildMegaMushroom };

export function createPowerup(spec) {
  const { x, y, z, kind = 'fire', id = null } = spec;
  const group = (BUILDERS[kind] || buildFireFlower)();
  group.position.set(x, y, z);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const baseY = y;
  let collected = false;

  return {
    type: 'powerup', kind, id, mesh: group, collected, radius: 0.72,
    get position() { return group.position; },
    update(dt, t) {
      if (collected) return;
      group.rotation.y += dt * 1.5;
      group.position.y = baseY + Math.sin(t * 2.2 + x) * 0.12;
    },
    tryCollect(px, pz, py) {
      if (collected) return false;
      if (Math.abs(py - group.position.y) > 1.5) return false;
      if (distance2D(px, pz, group.position.x, group.position.z) < this.radius) {
        collected = true;
        this.collected = true;
        group.visible = false;
        return true;
      }
      return false;
    },
  };
}

// ---------------------------------------------------------------------------

/**
 * A solid brick that only a Mega player can smash. Normal-size players just
 * bump their head on it, exactly like the classic games.
 */
export function createBrickBlock(spec, texture) {
  const { x, y, z, id = null } = spec;
  const mat = new THREE.MeshLambertMaterial(texture ? { map: texture } : { color: 0xb5651d });
  const mesh = new THREE.Mesh(geo.brick, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const collider = makeCollider(x, y, z, 1, 1, 1, { isPlatform: true, id });
  let broken = false;
  let bounceTimer = 0;

  return {
    type: 'brick', id, mesh, collider, broken,
    get position() { return mesh.position; },
    update(dt) {
      if (bounceTimer > 0) {
        bounceTimer -= dt;
        mesh.position.y = y + Math.sin(Math.max(0, bounceTimer) * 24) * 0.08;
        if (bounceTimer <= 0) mesh.position.y = y;
      }
    },
    /** Mega players shatter it; everyone else just knocks it. */
    hit(isMega) {
      if (broken) return false;
      if (!isMega) {
        bounceTimer = 0.2;
        return false;
      }
      broken = true;
      this.broken = true;
      mesh.visible = false;
      collider.disabled = true;
      collider.passthrough = true;
      collider.noGround = true;
      SFX.play('breakBlock');
      return true;
    },
  };
}
