import * as THREE from 'three';
import { makeCollider, updateColliderPosition } from '../core/Collision.js';
import { grassTexture, brickTexture, speckleTexture, plankTexture, checkerTexture, waveTexture } from '../utils/textures.js';

// ---------------------------------------------------------------------------
// Platform / MovingPlatform: a themed box mesh + matching AABB collider.
// One factory handles both static and moving platforms - pass `move` to
// make it patrol back and forth or in a loop. This is the single place
// that turns a level-data platform entry into real geometry.
// ---------------------------------------------------------------------------

const textureFns = { grass: grassTexture, brick: brickTexture, speckle: speckleTexture, plank: plankTexture, checker: checkerTexture, wave: waveTexture };
const matCache = new Map();

function getMat(kind, color) {
  const key = `${kind}_${color}`;
  if (!matCache.has(key)) {
    const fn = textureFns[kind] || speckleTexture;
    matCache.set(key, new THREE.MeshLambertMaterial({ map: fn(color) }));
  }
  return matCache.get(key);
}

function shade(color, amt) {
  const c = new THREE.Color(color);
  if (amt > 0) c.lerp(new THREE.Color(0xffffff), amt); else c.lerp(new THREE.Color(0x000000), -amt);
  return c.getHex();
}

/**
 * spec: { x,y,z, sx,sy,sz, color, textureType, uniform, move, id }
 * move (optional): { axis:'x'|'y'|'z', distance, speed, phase }
 */
export function createPlatform(spec) {
  const {
    x, y, z, sx = 2.4, sy = 0.6, sz = 2.4,
    color = 0x8bc34a, textureType = 'grass', uniform = false, move = null,
    passthrough = false, noGround = false, id = null,
  } = spec;

  const geo = new THREE.BoxGeometry(sx, sy, sz);
  let material;
  if (uniform) {
    material = getMat(textureType, color);
  } else {
    const topMat = getMat(textureType, color);
    const sideMat = getMat('speckle', shade(color, -0.35));
    const bottomMat = getMat('speckle', shade(color, -0.5));
    // Box face order: +x, -x, +y, -y, +z, -z
    material = [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat];
  }

  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const collider = makeCollider(x, y, z, sx, sy, sz, { passthrough, noGround, isPlatform: true, id });

  const platform = {
    mesh,
    collider,
    id,
    move,
    _t: move?.phase || 0,
    _prevX: x, _prevY: y, _prevZ: z,
    deltaX: 0, deltaY: 0, deltaZ: 0,

    update(dt) {
      if (!this.move) return;
      this._t += dt * this.move.speed;
      const s = Math.sin(this._t);
      const axis = this.move.axis || 'x';
      const nx = axis === 'x' ? x + s * this.move.distance : x;
      const ny = axis === 'y' ? y + s * this.move.distance : y;
      const nz = axis === 'z' ? z + s * this.move.distance : z;
      this.deltaX = nx - this._prevX;
      this.deltaY = ny - this._prevY;
      this.deltaZ = nz - this._prevZ;
      this._prevX = nx; this._prevY = ny; this._prevZ = nz;
      this.mesh.position.set(nx, ny, nz);
      updateColliderPosition(this.collider, nx, ny, nz);
    },
  };

  return platform;
}
