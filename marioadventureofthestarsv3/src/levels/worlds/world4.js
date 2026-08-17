import { LevelBuilder } from '../builder.js';

// World 4 - Mossglow Woods (forest). Introduces Boo (chasing) and dense
// secret-branch exploration.

function level4_1() {
  const b = new LevelBuilder({ id: '4-1', world: 4, index: 1, name: 'Mossy Trail', theme: 'forest', killY: -12 });
  b.ground(6, { width: 6 });
  b.setStart(-1, 0, 1);
  b.scatterProps(['tree', 'bush'], 5);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('koopa', { offsetX: 4, range: 3 });

  b.gap(2.4);
  b.ground(5, { width: 5 });
  b.enemyHere('goomba', { offsetX: 2, range: 1.6 });
  b.starAt(3.5, 0, 2, '-4-1a');
  b.checkpointHere({ offsetX: 0 });

  b.gap(2.2);
  b.platformHops(3, { hopLength: 1.6, hopWidth: 2.2, gapWidth: 1.8 });
  b.coinRow(3, { offsetX: 0, spacing: 1.4, height: 1.4 });

  b.ground(5, { width: 6 });
  b.scatterProps(['bush', 'tree'], 5);
  b.enemyHere('koopa', { offsetX: 2, range: 2.5 });
  b.starAt(4, 2.4, 1.8, '-4-1b');

  b.gap(2);
  b.stairs(3, { stepLength: 1.6, stepRise: 0.7, width: 5, gapWidth: 0.5 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(0, 0, 2.2, '-4-1c');

  b.gap(1.8);
  b.ground(5, { width: 6 });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level4_2() {
  const b = new LevelBuilder({ id: '4-2', world: 4, index: 2, name: 'Vine Bridges', theme: 'forest', killY: -12 });
  b.ground(5, { width: 6 });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('boo', { offsetX: 4, range: 0 });

  b.gap(2);
  b.movingPlatform({ travel: 7, axis: 'x', speed: 0.5, length: 2.6, width: 2.2, textureType: 'plank' });
  b.ground(4, { width: 5 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(1, 0, 2, '-4-2a');

  b.gap(2);
  b.movingPlatform({ travel: 6, axis: 'z', speed: 0.5, length: 2.4, width: 2.2, textureType: 'plank' });
  b.ground(4, { width: 5 });
  b.enemyHere('boo', { offsetX: 2, range: 0 });
  b.starAt(2.5, -2, 2, '-4-2b');

  b.gap(2.4);
  b.platformHops(4, { hopLength: 1.6, hopWidth: 2, gapWidth: 1.6, textureType: 'plank' });
  b.checkpointHere({ offsetX: 0 });
  b.coinRow(4, { offsetX: 0, spacing: 1.4, height: 1.3, arc: true });

  b.gap(2);
  b.ground(5, { width: 6 });
  b.enemyHere('koopa', { offsetX: 2, range: 2.5 });
  b.starAt(3.5, 2, 2, '-4-2c');

  b.gap(1.8);
  b.ground(4, { width: 6 });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level4_3() {
  const b = new LevelBuilder({ id: '4-3', world: 4, index: 3, name: 'Deep Woods Secret', theme: 'forest', killY: -12 });
  b.ground(6, { width: 7 });
  b.setStart(-1, 0, 1);
  b.scatterProps(['tree', 'bush', 'flower'], 6);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.pipeHere({ offsetX: 4, offsetZ: -2, height: 1.2 });
  b.enemyHere('piranha', { offsetX: 4, offsetZ: -2, range: 0 });

  b.gap(2.2);
  b.ground(5, { width: 5 });
  b.enemyHere('spiny', { offsetX: 2, range: 1.6 });
  b.checkpointHere({ offsetX: 0 });
  // secret branch behind the bushes
  b.scatterProps(['bush'], 5, { spreadZ: 1.5 });
  b.starAt(3, 3.2, 2, '-4-3a');

  b.gap(2.4);
  b.crumblePath(3, { stepLength: 1.8, width: 2.4, gapWidth: 0.6, delay: 0.7 });
  b.starAt(0, 0, 2, '-4-3b');

  b.ground(5, { width: 6 });
  b.enemyHere('boo', { offsetX: 3, range: 0 });
  b.checkpointHere({ offsetX: -1 });

  b.gap(2);
  b.stairs(3, { stepLength: 1.6, stepRise: 0.8, width: 5, gapWidth: 0.5 });
  b.starAt(0, 0, 2.2, '-4-3c');

  b.gap(1.8);
  b.ground(5, { width: 6 });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level4_4() {
  const b = new LevelBuilder({ id: '4-4', world: 4, index: 4, name: 'Thornback\'s Grove', theme: 'forest', isBoss: true, killY: -12 });
  b.ground(6, { width: 6 });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.gap(2);
  b.ground(23, { width: 23 });
  b.scatterProps(['tree', 'bush'], 7, { spreadZ: 8 });
  b.starAt(-7, 7, 2, '-4-4a');
  b.starAt(7, -7, 2, '-4-4b');
  b.starAt(0, 0, 6, '-4-4c');
  b.boss = { type: 'thornback', x: b.cursor.x, y: b.cursor.y + 1.4, z: b.cursor.z };
  b.introDialogue = [
    { character: 'toad', name: 'Toad', text: 'The Thornback Beast guards the deepest grove!' },
    { character: 'mario', name: 'Mario', text: 'Watch out, it summons Spinies. Time to get thorny!' },
  ];
  return b.build();
}

export function buildWorld4() {
  return [level4_1(), level4_2(), level4_3(), level4_4()];
}
