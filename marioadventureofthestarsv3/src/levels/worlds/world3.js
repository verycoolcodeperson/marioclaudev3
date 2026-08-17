import { LevelBuilder } from '../builder.js';

// World 3 - Frostpeak Range (snow). Introduces Paragoomba/Lakitu flyers and
// icy crumble platforms.

function level3_1() {
  const b = new LevelBuilder({ id: '3-1', world: 3, index: 1, name: 'Frosty Slopes', theme: 'snow', killY: -12 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0xf2f8ff });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('goomba', { offsetX: 4, range: 1.8 });

  b.stairs(3, { stepLength: 1.6, stepRise: 0.7, width: 5, gapWidth: 0.6, textureType: 'speckle', color: 0xf2f8ff });
  b.enemyHere('paragoomba', { offsetX: 0, range: 0 });
  b.starAt(0, 0, 2.4, '-3-1a');

  b.ground(4, { width: 5, textureType: 'speckle', color: 0xf2f8ff });
  b.checkpointHere({ offsetX: -1 });
  b.enemyHere('buzzy', { offsetX: 2, range: 1.6 });

  b.gap(2.6);
  b.platformHops(3, { hopLength: 1.6, hopWidth: 2.2, gapWidth: 1.8, textureType: 'speckle', color: 0xdff2ff });
  b.coinRow(4, { offsetX: 0, spacing: 1.6, height: 1.4, arc: true });

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xf2f8ff });
  b.starAt(2, 2, 2, '-3-1b');
  b.enemyHere('paragoomba', { offsetX: 3, range: 0 });

  b.stairs(3, { stepLength: 1.6, stepRise: -0.7, width: 5, gapWidth: 0.5, textureType: 'speckle', color: 0xf2f8ff });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(1, 0, 2, '-3-1c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xf2f8ff });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level3_2() {
  const b = new LevelBuilder({ id: '3-2', world: 3, index: 2, name: 'Frozen Lake', theme: 'snow', killY: -10 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0xf2f8ff });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.hazardBelow(5, 'water');

  b.gap(2.2);
  b.platformHops(3, { hopLength: 1.8, hopWidth: 2.4, gapWidth: 1.6, textureType: 'speckle', color: 0xdff2ff });
  b.enemyHere('lakitu', { offsetX: 0, range: 0 });
  b.checkpointHere({ offsetX: 0 });

  b.hazardBelow(6, 'water');
  b.gap(1);
  b.movingPlatform({ travel: 6, axis: 'x', speed: 0.5, length: 2.4, width: 2.4 });
  b.starAt(0, 0, 2, '-3-2a');
  b.ground(4, { width: 5, textureType: 'speckle', color: 0xf2f8ff });

  b.hazardBelow(5, 'water');
  b.gap(1);
  b.crumblePath(4, { stepLength: 1.6, width: 2.2, gapWidth: 0.5, delay: 0.6, respawnDelay: 3 });
  b.starAt(0, 0, 2.2, '-3-2b');

  b.ground(5, { width: 6, textureType: 'speckle', color: 0xf2f8ff });
  b.enemyHere('paragoomba', { offsetX: 2, range: 0 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(3, -2, 2, '-3-2c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xf2f8ff });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level3_3() {
  const b = new LevelBuilder({ id: '3-3', world: 3, index: 3, name: 'Blizzard Peak', theme: 'snow', killY: -12 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0xf2f8ff });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('chomp', { offsetX: 4, range: 2.4 });

  b.gap(2.4);
  b.crumblePath(4, { stepLength: 1.8, width: 2.4, gapWidth: 0.6, delay: 0.6, respawnDelay: 3 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(0, 0, 2, '-3-3a');

  b.gap(2);
  b.stairs(4, { stepLength: 1.6, stepRise: 0.8, width: 5, gapWidth: 0.5, textureType: 'speckle', color: 0xf2f8ff });
  b.enemyHere('lakitu', { offsetX: 0, range: 0 });
  b.starAt(0, 0, 2.4, '-3-3b');

  b.ground(5, { width: 5, textureType: 'speckle', color: 0xf2f8ff });
  b.checkpointHere({ offsetX: -1 });
  b.enemyHere('chomp', { offsetX: 2, range: 2 });

  b.gap(2.6);
  b.movingPlatform({ travel: 6, axis: 'z', speed: 0.55, length: 2.4, width: 2.4 });
  b.ground(4, { width: 5, textureType: 'speckle', color: 0xf2f8ff });
  b.starAt(2, 0, 2, '-3-3c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xf2f8ff });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level3_4() {
  const b = new LevelBuilder({ id: '3-4', world: 3, index: 4, name: "The Yeti's Roar", theme: 'snow', isBoss: true, killY: -12 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0xf2f8ff });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.gap(2);
  b.ground(23, { width: 23, textureType: 'speckle', color: 0xf2f8ff });
  b.scatterProps(['rock'], 6, { spreadZ: 8 });
  b.starAt(-7, 7, 2, '-3-4a');
  b.starAt(7, -7, 2, '-3-4b');
  b.starAt(0, 0, 6, '-3-4c');
  b.boss = { type: 'frostYeti', x: b.cursor.x, y: b.cursor.y + 1.4, z: b.cursor.z };
  b.introDialogue = [
    { character: 'luigi', name: 'Luigi', text: "Th-th-that Yeti looks angry!" },
    { character: 'mario', name: 'Mario', text: "It slams the ground - watch your step, then strike back!" },
  ];
  return b.build();
}

export function buildWorld3() {
  return [level3_1(), level3_2(), level3_3(), level3_4()];
}
