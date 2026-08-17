import { LevelBuilder } from '../builder.js';

// World 1 - Greenhorn Fields (grassland). Easiest world; introduces basic
// platforming, Goombas/Buzzy Beetles, and a gentle moving-platform gimmick.

function level1_1() {
  const b = new LevelBuilder({ id: '1-1', world: 1, index: 1, name: 'Sunny Meadows', theme: 'grassland' });
  b.ground(6, { width: 6 });
  b.setStart(-1, 0, 1);
  b.scatterProps(['tree', 'flower', 'bush'], 4);
  b.coinRow(3, { offsetX: 1.5, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3.5 });
  b.enemyHere('goomba', { offsetX: 4.5, range: 1.8 });

  b.gap(2.4);
  b.ground(5, { width: 5 });
  b.enemyHere('goomba', { offsetX: 2, range: 1.6 });
  b.starAt(4, 0, 2.2, '-1-1a');
  b.checkpointHere({ offsetX: 0.5 });

  b.gap(2);
  b.movingPlatform({ travel: 5, axis: 'z', speed: 0.55, length: 2.6, width: 2.6 });
  b.ground(4, { width: 5 });
  b.coinRow(4, { offsetX: 0.5, spacing: 0.8, height: 1.2 });
  b.enemyHere('buzzy', { offsetX: 3, range: 1.6 });

  b.gap(2.6);
  b.ground(5, { width: 6 });
  b.starAt(2.5, -2.2, 2, '-1-1b');
  b.scatterProps(['flower', 'bush'], 3);
  b.enemyHere('goomba', { offsetX: 3.5, range: 1.4 });

  b.stairs(3, { stepLength: 1.6, stepRise: 0.7, width: 5, gapWidth: 0.5 });
  b.starAt(1, 0, 2, '-1-1c');
  b.checkpointHere({ offsetX: 0 });
  b.coinRow(3, { offsetX: 2, height: 1.4, arc: true });

  b.gap(1.8);
  b.ground(5, { width: 6 });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level1_2() {
  const b = new LevelBuilder({ id: '1-2', world: 1, index: 2, name: 'Blossom Hills', theme: 'grassland' });
  b.ground(5, { width: 6 });
  b.setStart(-1, 0, 0);
  b.scatterProps(['tree', 'flower'], 4);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });

  b.stairs(4, { stepLength: 1.8, stepRise: 0.8, width: 5, gapWidth: 0.6 });
  b.enemyHere('buzzy', { offsetX: 0, range: 1.4 });
  b.starAt(0, 0, 2.4, '-1-2a');

  b.ground(4, { width: 5 });
  b.checkpointHere({ offsetX: -1 });
  b.enemyHere('koopa', { offsetX: 2, range: 3 });

  b.gap(2.2);
  b.platformHops(3, { hopLength: 1.6, hopWidth: 2.4, gapWidth: 1.6 });
  b.coinRow(3, { offsetX: 0, spacing: 1.6, height: 1.4 });

  b.ground(5, { width: 6 });
  // secret branch: a hidden nook behind bushes off the main path
  b.scatterProps(['bush'], 4, { spreadZ: 2 });
  b.starAt(2, 3.4, 1.8, '-1-2b');
  b.enemyHere('goomba', { offsetX: 3, range: 1.6 });

  b.stairs(3, { stepLength: 1.6, stepRise: -0.6, width: 5, gapWidth: 0.5, textureType: 'grass', color: 0x4caf50 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(1, 0, 2, '-1-2c');

  b.gap(2);
  b.ground(5, { width: 6 });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level1_3() {
  const b = new LevelBuilder({ id: '1-3', world: 1, index: 3, name: 'Piranha Patch', theme: 'grassland' });
  b.ground(6, { width: 6 });
  b.setStart(-1, 0, 1);
  b.pipeHere({ offsetX: 3, offsetZ: -1.4, height: 1.2, color: 0x2fae4a });
  b.enemyHere('piranha', { offsetX: 3, offsetZ: -1.4, range: 0 });
  b.coinRow(3, { offsetX: 0.5, height: 1.2 });

  b.gap(2.4);
  b.ground(4, { width: 5 });
  b.pipeHere({ offsetX: 2, offsetZ: 1.4, height: 1.6, color: 0x2fae4a });
  b.enemyHere('piranha', { offsetX: 2, offsetZ: 1.4, range: 0 });
  b.checkpointHere({ offsetX: 0 });

  b.gap(1.6);
  b.crumblePath(4, { stepLength: 1.6, width: 2.2, gapWidth: 0.6, delay: 0.6 });
  b.starAt(0, 0, 2.4, '-1-3a');

  b.ground(5, { width: 6 });
  b.enemyHere('goomba', { offsetX: 2, range: 1.6 });
  b.enemyHere('buzzy', { offsetX: 3.5, range: 1.2 });
  b.starAt(1.5, -2, 1.8, '-1-3b');

  b.gap(2.2);
  b.movingPlatform({ travel: 6, axis: 'x', speed: 0.5, length: 2.4, width: 2.4 });
  b.ground(4, { width: 5 });
  b.checkpointHere({ offsetX: 0 });
  b.coinRow(4, { offsetX: 0, spacing: 0.8, height: 1.3, arc: true });

  b.gap(2);
  b.ground(5, { width: 6 });
  b.pipeHere({ offsetX: 2, offsetZ: -1.6, height: 1.2 });
  b.enemyHere('piranha', { offsetX: 2, offsetZ: -1.6, range: 0 });
  b.starAt(3.5, 1.6, 2, '-1-3c');

  b.gap(1.8);
  b.ground(4, { width: 6 });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level1_4() {
  const b = new LevelBuilder({ id: '1-4', world: 1, index: 4, name: 'Grand Goomba Showdown', theme: 'grassland', isBoss: true });
  b.ground(6, { width: 6 });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.gap(2);
  b.ground(22, { width: 22 });
  b.scatterProps(['rock', 'tree'], 6, { spreadZ: 8 });
  b.starAt(-7, 8, 2, '-1-4a');
  b.starAt(7, -8, 2, '-1-4b');
  b.starAt(0, 0, 6, '-1-4c');
  b.boss = { type: 'grandGoomba', x: b.cursor.x, y: b.cursor.y + 1.4, z: b.cursor.z };
  b.introDialogue = [
    { character: 'mario', name: 'Mario', text: 'Whoa, that Goomba is HUGE!' },
    { character: 'toad', name: 'Toad', text: "It's the Grand Goomba! Stomp it when it's dizzy!" },
  ];
  return b.build();
}

export function buildWorld1() {
  return [level1_1(), level1_2(), level1_3(), level1_4()];
}
