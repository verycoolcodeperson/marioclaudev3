// ---------------------------------------------------------------------------
// Lightweight collision helpers used by the player and enemies.
// We deliberately avoid a physics engine: the world is made of axis-aligned
// boxes (colliders), and actors are treated as a vertical cylinder (radius +
// height). This is cheap, predictable, and plenty for a platformer.
// ---------------------------------------------------------------------------

/** Creates a simple AABB collider descriptor. y is the vertical center. */
export function makeCollider(x, y, z, sx, sy, sz, extra = {}) {
  return {
    x, y, z,
    minX: x - sx / 2, maxX: x + sx / 2,
    minY: y - sy / 2, maxY: y + sy / 2,
    minZ: z - sz / 2, maxZ: z + sz / 2,
    sx, sy, sz,
    ...extra,
  };
}

/** Re-centers a collider (used for moving platforms). */
export function updateColliderPosition(col, x, y, z) {
  col.x = x; col.y = y; col.z = z;
  col.minX = x - col.sx / 2; col.maxX = x + col.sx / 2;
  col.minY = y - col.sy / 2; col.maxY = y + col.sy / 2;
  col.minZ = z - col.sz / 2; col.maxZ = z + col.sz / 2;
}

/** Finds the highest walkable surface at (x,z) at or below maxY (+small tolerance). */
export function sampleGround(x, z, maxY, colliders, tolerance = 0.35) {
  let best = null;
  for (const col of colliders) {
    if (col.noGround) continue;
    if (x < col.minX || x > col.maxX || z < col.minZ || z > col.maxZ) continue;
    if (col.maxY > maxY + tolerance) continue;
    if (!best || col.maxY > best.maxY) best = col;
  }
  return best;
}

/** Pushes a circle (px,pz,radius) out of a box collider's XZ footprint. Returns null if no overlap. */
export function circlePushout(px, pz, radius, col) {
  const cx = Math.max(col.minX, Math.min(px, col.maxX));
  const cz = Math.max(col.minZ, Math.min(pz, col.maxZ));
  const dx = px - cx;
  const dz = pz - cz;
  const distSq = dx * dx + dz * dz;
  if (distSq >= radius * radius) return null;
  const dist = Math.sqrt(distSq);
  if (dist < 1e-5) {
    // Center is inside the box; push out along the shortest axis.
    const dLeft = px - col.minX, dRight = col.maxX - px;
    const dFront = pz - col.minZ, dBack = col.maxZ - pz;
    const min = Math.min(dLeft, dRight, dFront, dBack);
    if (min === dLeft) return { nx: -1, nz: 0, overlap: radius + dLeft };
    if (min === dRight) return { nx: 1, nz: 0, overlap: radius + dRight };
    if (min === dFront) return { nx: 0, nz: -1, overlap: radius + dFront };
    return { nx: 0, nz: 1, overlap: radius + dBack };
  }
  return { nx: dx / dist, nz: dz / dist, overlap: radius - dist };
}

/**
 * Resolves horizontal movement of a cylinder actor against wall colliders
 * (colliders whose vertical span overlaps the actor's body). Mutates and
 * returns {x, z}.
 */
export function resolveWalls(x, y, z, radius, height, colliders) {
  let px = x, pz = z;
  const feet = y;
  const head = y + height;
  for (const col of colliders) {
    if (col.passthrough) continue;
    if (col.maxY <= feet + 0.02 || col.minY >= head - 0.02) continue; // not overlapping vertically enough to be a wall
    const push = circlePushout(px, pz, radius, col);
    if (push) {
      px += push.nx * push.overlap;
      pz += push.nz * push.overlap;
    }
  }
  return { x: px, z: pz };
}

export function aabbOverlap(a, b) {
  return a.minX <= b.maxX && a.maxX >= b.minX &&
    a.minY <= b.maxY && a.maxY >= b.minY &&
    a.minZ <= b.maxZ && a.maxZ >= b.minZ;
}

export function distance2D(x1, z1, x2, z2) {
  const dx = x1 - x2, dz = z1 - z2;
  return Math.sqrt(dx * dx + dz * dz);
}
