import * as THREE from 'three';
import { makeCollider } from '../core/Collision.js';
import { questionBlockTexture, usedBlockTexture } from '../utils/textures.js';
import { SFX } from '../core/Audio.js';

// ---------------------------------------------------------------------------
// The classic "Lucky Block" (? block): a solid block you can stand on or
// bump from underneath. Bumping it from below pops a coin (or a Star for
// bigger blocks) and turns it into a dull used block. Reuses the same
// AABB collider scheme as Platform.js so it behaves identically for
// standing/walking/jumping.
// ---------------------------------------------------------------------------

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const activeMat = new THREE.MeshLambertMaterial({ map: questionBlockTexture() });
const usedMat = new THREE.MeshLambertMaterial({ map: usedBlockTexture() });

export function createLuckyBlock(spec) {
  const { x, y, z, contents = 'coin', id = null } = spec;
  const mesh = new THREE.Mesh(boxGeo, activeMat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const collider = makeCollider(x, y, z, 1, 1, 1, { isPlatform: true, id });
  const baseY = y;
  let used = false;
  let bounceTimer = 0;

  return {
    type: 'block', id, mesh, collider, contents, used,
    get position() { return mesh.position; },
    update(dt) {
      if (bounceTimer > 0) {
        bounceTimer -= dt;
        const t = Math.max(0, bounceTimer);
        mesh.position.y = baseY + Math.sin(t * 24) * 0.1 * (t / 0.22);
        if (bounceTimer <= 0) mesh.position.y = baseY;
      }
    },
    /** Called when a player's head bumps this block from directly below. */
    bump(onDispense) {
      if (used) return false;
      used = true;
      this.used = true;
      mesh.material = usedMat;
      bounceTimer = 0.22;
      SFX.play('coin');
      onDispense?.(x, y + 1.0, z, contents);
      return true;
    },
  };
}
