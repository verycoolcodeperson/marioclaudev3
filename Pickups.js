import * as THREE from 'three';
import { distance2D } from '../core/Collision.js';

// ---------------------------------------------------------------------------
// Coin + Star pickups. Both spin slowly and bob up/down; a simple sphere
// distance check (no colliders needed) handles pickup. Geometry/material
// are shared across every instance.
// ---------------------------------------------------------------------------

const coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 10);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd54a, emissive: 0x664400, emissiveIntensity: 0.25, metalness: 0.3, roughness: 0.4 });

const starGeoCache = (() => {
  const shape = new THREE.Shape();
  const spikes = 5, outerR = 0.42, innerR = 0.18;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
})();
const starMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x998200, emissiveIntensity: 0.35, metalness: 0.2, roughness: 0.3 });

export function createCoin(spec) {
  const { x, y, z, id = null } = spec;
  const mesh = new THREE.Mesh(coinGeo, coinMat);
  mesh.position.set(x, y, z);
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = false;
  const baseY = y;
  let collected = false;
  return {
    type: 'coin', id, mesh, collected, radius: 0.55,
    get position() { return mesh.position; },
    update(dt, t) {
      if (collected) return;
      mesh.rotation.z += dt * 2.4;
      mesh.position.y = baseY + Math.sin(t * 2.4 + x) * 0.08;
    },
    tryCollect(px, pz, py) {
      if (collected) return false;
      if (Math.abs(py - mesh.position.y) > 1.1) return false;
      if (distance2D(px, pz, mesh.position.x, mesh.position.z) < this.radius) {
        collected = true;
        this.collected = true;
        mesh.visible = false;
        return true;
      }
      return false;
    },
  };
}

export function createStar(spec) {
  const { x, y, z, id } = spec;
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(starGeoCache, starMat);
  mesh.position.set(-0.21, -0.21, -0.08);
  group.add(mesh);
  group.position.set(x, y, z);
  const baseY = y;
  let collected = false;
  return {
    type: 'star', id, mesh: group, collected, radius: 0.7,
    get position() { return group.position; },
    update(dt, t) {
      if (collected) return;
      group.rotation.y += dt * 1.6;
      group.position.y = baseY + Math.sin(t * 1.6 + x) * 0.15;
    },
    tryCollect(px, pz, py) {
      if (collected) return false;
      if (Math.abs(py - group.position.y) > 1.3) return false;
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
