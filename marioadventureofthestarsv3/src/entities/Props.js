import * as THREE from 'three';
import { makeCollider } from '../core/Collision.js';
import { iconSignTexture } from '../utils/textures.js';

// ---------------------------------------------------------------------------
// Small reusable decorative props (trees, clouds, rocks, flowers, pipes,
// signs, flags, bushes). Purely visual set-dressing built from primitives -
// cheap, chunky, colorful. `createPipe` optionally returns a collider since
// pipes are sometimes used as solid obstacles/teleport dressing.
// ---------------------------------------------------------------------------

const geo = {
  trunk: new THREE.CylinderGeometry(0.18, 0.22, 1.4, 7),
  leafBall: new THREE.SphereGeometry(0.75, 8, 6),
  cloudPuff: new THREE.SphereGeometry(0.5, 8, 6),
  rock: new THREE.DodecahedronGeometry(0.5, 0),
  flowerStem: new THREE.CylinderGeometry(0.03, 0.03, 0.35, 5),
  flowerBloom: new THREE.SphereGeometry(0.11, 6, 5),
  pipe: new THREE.CylinderGeometry(0.6, 0.6, 1, 12),
  pipeRim: new THREE.CylinderGeometry(0.72, 0.72, 0.28, 12),
  signPost: new THREE.CylinderGeometry(0.06, 0.06, 1, 6),
  signBoard: new THREE.BoxGeometry(0.9, 0.55, 0.08),
  bush: new THREE.SphereGeometry(0.5, 8, 6),
  contactShadow: new THREE.CircleGeometry(0.6, 14),
};
const contactShadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });

/** A cheap flat dark blob under a prop so it never looks like it's floating. */
export function createContactShadow(radius = 0.6) {
  const mesh = new THREE.Mesh(geo.contactShadow, contactShadowMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.setScalar(radius / 0.6);
  mesh.position.y = 0.015;
  return mesh;
}
const matCache = new Map();
function mat(color, opts = {}) {
  const key = `${color}_${JSON.stringify(opts)}`;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return matCache.get(key);
}

export function createTree(x, y, z, { trunkColor = 0x8b5a2b, leafColor = 0x3fae4a, scale = 1 } = {}) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(geo.trunk, mat(trunkColor));
  trunk.position.y = 0.7;
  trunk.castShadow = true;
  g.add(trunk);
  const leafPositions = [[0, 1.5, 0], [0.4, 1.25, 0.2], [-0.4, 1.2, -0.2], [0, 1.9, 0.1]];
  for (const [lx, ly, lz] of leafPositions) {
    const leaf = new THREE.Mesh(geo.leafBall, mat(leafColor));
    leaf.position.set(lx, ly, lz);
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.add(createContactShadow(0.85));
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  return g;
}

const cloudMatCache = new Map();
function cloudMat(color) {
  if (!cloudMatCache.has(color)) cloudMatCache.set(color, new THREE.MeshBasicMaterial({ color }));
  return cloudMatCache.get(color);
}
/**
 * Unlit on purpose: directional lighting turns a cluster of spheres into
 * visibly separate lit/shadowed golf-balls instead of a soft cloud. Flat
 * shading + tight, flattened overlap reads as one cohesive puffy shape.
 */
export function createCloud(x, y, z, { color = 0xffffff, scale = 1 } = {}) {
  const g = new THREE.Group();
  const material = cloudMat(color);
  const puffs = [
    [0, 0, 0], [0.5, 0.02, 0.08], [-0.5, 0.02, -0.08], [0.25, 0.15, -0.15], [-0.25, 0.12, 0.15],
    [0.9, -0.05, 0], [-0.9, -0.05, 0], [0.1, 0.22, 0],
  ];
  for (const [px, py, pz] of puffs) {
    const puff = new THREE.Mesh(geo.cloudPuff, material);
    puff.position.set(px, py * 0.7, pz);
    puff.scale.set(0.95 + Math.random() * 0.25, 0.68 + Math.random() * 0.15, 0.95 + Math.random() * 0.25);
    g.add(puff);
  }
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  return g;
}

export function createRock(x, y, z, { color = 0x9a9a9a, scale = 1 } = {}) {
  const rock = new THREE.Mesh(geo.rock, mat(color));
  rock.position.set(x, y, z);
  rock.scale.set(scale * (0.8 + Math.random() * 0.4), scale * (0.7 + Math.random() * 0.3), scale * (0.8 + Math.random() * 0.4));
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

export function createFlower(x, y, z, { color = 0xff6a9c } = {}) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(geo.flowerStem, mat(0x3fae4a));
  stem.position.y = 0.17;
  g.add(stem);
  const bloom = new THREE.Mesh(geo.flowerBloom, mat(color));
  bloom.position.y = 0.36;
  g.add(bloom);
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), mat(0xffe066));
  center.position.y = 0.36;
  g.add(center);
  g.position.set(x, y, z);
  return g;
}

export function createPipe(x, y, z, { color = 0x2fae4a, height = 1.4, withCollider = true } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo.pipe, mat(color));
  body.scale.set(1, height, 1);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  const rim = new THREE.Mesh(geo.pipeRim, mat(color));
  rim.position.y = height + 0.05;
  rim.castShadow = true;
  g.add(rim);
  g.position.set(x, y, z);
  const collider = withCollider ? makeCollider(x, y + height / 2, z, 1.2, height + 0.3, 1.2) : null;
  return { group: g, collider };
}

export function createSign(x, y, z, { rotationY = 0, icon = null } = {}) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(geo.signPost, mat(0x8b5a2b));
  post.position.y = 0.5;
  post.castShadow = true;
  g.add(post);
  const boardMat = icon
    ? new THREE.MeshLambertMaterial({ map: iconSignTexture(icon) })
    : mat(0xe8c88a);
  const board = new THREE.Mesh(geo.signBoard, boardMat);
  board.position.y = 1.05;
  board.castShadow = true;
  g.add(board);
  g.position.set(x, y, z);
  g.rotation.y = rotationY;
  return g;
}

export function createBush(x, y, z, { color = 0x3fae4a, scale = 1 } = {}) {
  const g = new THREE.Group();
  const puffs = [[0, 0, 0], [0.35, 0.05, 0.15], [-0.35, 0.05, -0.1], [0.1, 0.15, -0.2]];
  for (const [px, py, pz] of puffs) {
    const puff = new THREE.Mesh(geo.bush, mat(color));
    puff.position.set(px, py, pz);
    puff.scale.setScalar(0.6 + Math.random() * 0.25);
    puff.castShadow = true;
    g.add(puff);
  }
  g.add(createContactShadow(0.55));
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  return g;
}

/**
 * A flat, unlit mountain-range silhouette spanning the whole level, planted
 * behind the play area so the side-on camera always has something behind
 * the cliffs instead of open sky reaching to infinity - matches the layered
 * background hills you see in Super Mario 3D World's stages. One draw
 * call, no collision, fades into the fog at its edges automatically.
 */
export function createMountainBackdrop({ color = 0x2e7d32, z = -20, width = 260, baseY = -6, peakMin = 16, peakMax = 34, seed = 1 } = {}) {
  let s = seed >>> 0;
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s % 1000) / 1000; };

  const shape = new THREE.Shape();
  const half = width / 2;
  shape.moveTo(-half, baseY);
  const peakCount = Math.round(width / 14);
  for (let i = 0; i <= peakCount; i++) {
    const px = -half + (i / peakCount) * width;
    const py = baseY + peakMin + rand() * (peakMax - peakMin);
    shape.lineTo(px, py);
  }
  shape.lineTo(half, baseY);
  shape.closePath();

  const geo2 = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({ color, fog: true });
  const mesh = new THREE.Mesh(geo2, material);
  mesh.position.set(0, 0, z);
  mesh.renderOrder = -1;
  return mesh;
}
