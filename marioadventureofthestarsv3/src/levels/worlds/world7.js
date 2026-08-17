import { LevelBuilder } from '../builder.js';

// World 7 - Cloudtop Heights (sky). Mostly floating-platform traversal
// high above a bottomless drop - the trickiest platforming yet.

function level7_1() {
  const b = new LevelBuilder({ id: '7-1', world: 7, index: 1, name: 'Cloud Walk', theme: 'sky', killY: -16 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0xfff6dd });
  b.setStart(-1, 0, 1);
  b.scatterProps(['cloud'], 4, { yOffset: 3 });
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('paragoomba', { offsetX: 4, range: 0 });

  b.gap(2.4);
  b.platformHops(4, { hopLength: 1.6, hopWidth: 2.2, gapWidth: 1.8 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(0, 0, 2, '-7-1a');

  b.gap(2.2);
  b.movingPlatform({ travel: 6, axis: 'z', speed: 0.55, length: 2.4, width: 2.4 });
  b.ground(4, { width: 5, textureType: 'speckle', color: 0xfff6dd });
  b.enemyHere('lakitu', { offsetX: 1, range: 0 });
  b.starAt(2, 0, 2, '-7-1b');

  b.gap(2.4);
  b.platformHops(4, { hopLength: 1.6, hopWidth: 2, gapWidth: 1.9 });
  b.checkpointHere({ offsetX: 0 });
  b.coinRow(4, { offsetX: 0, spacing: 1.4, height: 1.3, arc: true });

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xfff6dd });
  b.starAt(2.5, 0, 2.2, '-7-1c');
  b.goalHere({ offsetX: 2 });
  return b.build();
}

function level7_2() {
  const b = new LevelBuilder({ id: '7-2', world: 7, index: 2, name: 'Windy Heights', theme: 'sky', killY: -16 });
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xfff6dd });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('boo', { offsetX: 4, range: 0 });

  b.gap(2.4);
  b.movingPlatform({ travel: 7, axis: 'x', speed: 0.6, length: 2.4, width: 2.2 });
  b.ground(4, { width: 5, textureType: 'speckle', color: 0xfff6dd });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(1, 0, 2, '-7-2a');

  b.gap(2.4);
  b.movingPlatform({ travel: 6, axis: 'y', speed: 0.45, length: 2.4, width: 2.2 });
  b.ground(4, { width: 5, textureType: 'speckle', color: 0xfff6dd });
  b.enemyHere('paragoomba', { offsetX: 1, range: 0 });
  b.starAt(2, 0, 2, '-7-2b');

  b.gap(2.6);
  b.platformHops(4, { hopLength: 1.5, hopWidth: 2, gapWidth: 1.9 });
  b.checkpointHere({ offsetX: 0 });
  b.enemyHere('boo', { offsetX: 0, range: 0 });

  b.gap(2.2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xfff6dd });
  b.starAt(2.5, 0, 2, '-7-2c');
  b.goalHere({ offsetX: 2 });
  return b.build();
}

function level7_3() {
  const b = new LevelBuilder({ id: '7-3', world: 7, index: 3, name: 'Storm Spires', theme: 'sky', killY: -16 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0xfff6dd });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('lakitu', { offsetX: 4, range: 0 });

  b.gap(2.2);
  b.crumblePath(4, { stepLength: 1.6, width: 2.2, gapWidth: 0.7, delay: 0.55, respawnDelay: 3 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(0, 0, 2, '-7-3a');

  b.gap(2.2);
  b.movingPlatform({ travel: 7, axis: 'x', speed: 0.6, length: 2.2, width: 2.2 });
  b.gap(2.2);
  b.movingPlatform({ travel: 6, axis: 'z', speed: 0.55, length: 2.2, width: 2.2 });
  b.ground(4, { width: 5, textureType: 'speckle', color: 0xfff6dd });
  b.enemyHere('paragoomba', { offsetX: 1, range: 0 });
  b.starAt(1.5, 0, 2, '-7-3b');

  b.checkpointHere({ offsetX: -1 });
  b.gap(2.4);
  b.platformHops(5, { hopLength: 1.5, hopWidth: 1.9, gapWidth: 1.9 });
  b.enemyHere('boo', { offsetX: 0, range: 0 });

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xfff6dd });
  b.starAt(2.5, 0, 2.2, '-7-3c');
  b.goalHere({ offsetX: 2 });
  return b.build();
}

function level7_4() {
  const b = new LevelBuilder({ id: '7-4', world: 7, index: 4, name: "Sky Griffin's Roost", theme: 'sky', isBoss: true, killY: -16 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0xfff6dd });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.gap(2);
  b.ground(24, { width: 24, textureType: 'speckle', color: 0xfff6dd });
  b.scatterProps(['cloud'], 6, { spreadZ: 8, yOffset: 4 });
  b.starAt(-8, 8, 2, '-7-4a');
  b.starAt(8, -8, 2, '-7-4b');
  b.starAt(0, 0, 7, '-7-4c');
  b.boss = { type: 'skyGriffin', x: b.cursor.x, y: b.cursor.y + 1.4, z: b.cursor.z };
  b.introDialogue = [
    { character: 'luigi', name: 'Luigi', text: 'The Griffin controls the whole sky up here!' },
    { character: 'mario', name: 'Mario', text: "Time to bring it back down to earth." },
  ];
  return b.build();
}

export function buildWorld7() {
  return [level7_1(), level7_2(), level7_3(), level7_4()];
}
