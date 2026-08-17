import { buildWorld1 } from './worlds/world1.js';
import { buildWorld2 } from './worlds/world2.js';
import { buildWorld3 } from './worlds/world3.js';
import { buildWorld4 } from './worlds/world4.js';
import { buildWorld5 } from './worlds/world5.js';
import { buildWorld6 } from './worlds/world6.js';
import { buildWorld7 } from './worlds/world7.js';
import { buildWorld8 } from './worlds/world8.js';
import { buildTutorialLevel } from './tutorial.js';

// ---------------------------------------------------------------------------
// Central lookup for level DATA (not live entities - see Level.js for that).
// Add a new world by writing levels/worlds/worldN.js in the same shape and
// registering it here; nothing else in the game needs to know about it.
// ---------------------------------------------------------------------------
const WORLD_BUILDERS = {
  1: buildWorld1, 2: buildWorld2, 3: buildWorld3, 4: buildWorld4,
  5: buildWorld5, 6: buildWorld6, 7: buildWorld7, 8: buildWorld8,
};

const worldCache = new Map();
let tutorialCache = null;

export function getWorldLevels(worldNum) {
  if (!worldCache.has(worldNum)) {
    const builder = WORLD_BUILDERS[worldNum];
    worldCache.set(worldNum, builder ? builder() : []);
  }
  return worldCache.get(worldNum);
}

export function getLevelById(id) {
  for (let w = 1; w <= 8; w++) {
    const found = getWorldLevels(w).find((l) => l.id === id);
    if (found) return found;
  }
  return null;
}

export function getTutorialLevel() {
  if (!tutorialCache) tutorialCache = buildTutorialLevel();
  return tutorialCache;
}
