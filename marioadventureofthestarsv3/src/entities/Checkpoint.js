import * as THREE from 'three';
import { distance2D } from '../core/Collision.js';
import { SFX } from '../core/Audio.js';

// ---------------------------------------------------------------------------
// A simple flag on a pole. Touching it (any player) sets the shared
// respawn point and flips the flag from red to green.
// ---------------------------------------------------------------------------

const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6);
const poleMat = new THREE.MeshLambertMaterial({ color: 0xd8d8d8 });
const flagGeo = new THREE.PlaneGeometry(0.7, 0.5);
const ballGeo = new THREE.SphereGeometry(0.14, 8, 6);
const ballMat = new THREE.MeshLambertMaterial({ color: 0xffe066 });

export function createCheckpoint(spec) {
  const { x, y, z, id } = spec;
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.6;
  pole.castShadow = true;
  group.add(pole);

  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.y = 3.25;
  group.add(ball);

  const flagMat = new THREE.MeshLambertMaterial({ color: 0xe6302c, side: THREE.DoubleSide });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(0.4, 2.6, 0);
  group.add(flag);

  let active = false;

  return {
    type: 'checkpoint', id, mesh: group, active,
    get position() { return group.position; },
    update(dt, t) {
      flag.rotation.y = Math.sin(t * 2 + x) * 0.25;
    },
    tryActivate(px, pz) {
      if (active) return false;
      if (distance2D(px, pz, group.position.x, group.position.z) < 1.2) {
        active = true;
        this.active = true;
        flagMat.color.set(0x35c04a);
        SFX.play('checkpoint');
        return true;
      }
      return false;
    },
  };
}
