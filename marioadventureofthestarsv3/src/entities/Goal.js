import * as THREE from 'three';
import { distance2D } from '../core/Collision.js';

// ---------------------------------------------------------------------------
// End-of-level goal pole with a spinning star on top. Reaching it fires
// `onReached(playerId)` once (subsequent touches are ignored).
// ---------------------------------------------------------------------------

const poleGeo = new THREE.CylinderGeometry(0.09, 0.09, 5, 8);
const poleMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
const baseGeo = new THREE.CylinderGeometry(0.9, 1, 0.25, 12);
const baseMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

const starGeo = (() => {
  const shape = new THREE.Shape();
  const spikes = 5, outerR = 0.5, innerR = 0.21;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
})();
const starMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x998200, emissiveIntensity: 0.4 });

export function createGoal(spec) {
  const { x, y, z } = spec;
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.12;
  base.receiveShadow = true;
  group.add(base);

  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2.6;
  pole.castShadow = true;
  group.add(pole);

  const starGroup = new THREE.Group();
  starGroup.position.y = 5.1;
  const star = new THREE.Mesh(starGeo, starMat);
  star.position.set(-0.25, -0.25, -0.09);
  starGroup.add(star);
  group.add(starGroup);

  const light = new THREE.PointLight(0xffe066, 0.6, 6);
  light.position.y = 5.1;
  group.add(light);

  let reached = false;

  return {
    type: 'goal', mesh: group, reached,
    get position() { return group.position; },
    update(dt, t) {
      starGroup.rotation.y += dt * 1.8;
      starGroup.position.y = 5.1 + Math.sin(t * 1.5) * 0.1;
    },
    tryReach(px, pz) {
      if (reached) return false;
      if (distance2D(px, pz, group.position.x, group.position.z) < 1.3) {
        reached = true;
        this.reached = true;
        return true;
      }
      return false;
    },
  };
}
