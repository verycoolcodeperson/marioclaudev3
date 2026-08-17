import { LevelBuilder } from '../builder.js';

// World 8 - Bowser's Keep (castle). The final gauntlet - toughest enemy
// mixes, longest levels, ending in the Bowser fight.

function level8_1() {
  const b = new LevelBuilder({ id: '8-1', world: 8, index: 1, name: 'Castle Gates', theme: 'castle', killY: -12 });
  b.ground(6, { width: 6, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('hammerbro', { offsetX: 4, range: 0 });

  b.gap(2.2);
  b.ground(5, { width: 5, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.enemyHere('spiny', { offsetX: 1, range: 1.6 });
  b.enemyHere('koopa', { offsetX: 3, range: 2 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(3.5, 0, 2, '-8-1a');

  b.gap(2.4);
  b.stairs(4, { stepLength: 1.6, stepRise: 0.8, width: 5, gapWidth: 0.5, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.enemyHere('hammerbro', { offsetX: 0, range: 0 });
  b.starAt(0, 0, 2.4, '-8-1b');

  b.ground(5, { width: 5, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.checkpointHere({ offsetX: -1 });
  b.enemyHere('buzzy', { offsetX: 2, range: 1.6 });
  b.starAt(3, 0, 2, '-8-1c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level8_2() {
  const b = new LevelBuilder({ id: '8-2', world: 8, index: 2, name: 'Shadow Halls', theme: 'castle', killY: -12 });
  b.ground(5, { width: 6, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('boo', { offsetX: 4, range: 0 });

  b.gap(2.2);
  b.crumblePath(4, { stepLength: 1.6, width: 2.2, gapWidth: 0.6, delay: 0.5, respawnDelay: 3 });
  b.checkpointHere({ offsetX: 0 });
  b.enemyHere('boo', { offsetX: 0, range: 0 });
  b.starAt(0, 0, 2, '-8-2a');

  b.gap(2.2);
  b.pipeHere({ offsetX: 1.5, offsetZ: -1.6, height: 1.4 });
  b.enemyHere('piranha', { offsetX: 1.5, offsetZ: -1.6, range: 0 });
  b.ground(5, { width: 5, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.starAt(2.5, 1.6, 2, '-8-2b');

  b.gap(2.4);
  b.movingPlatform({ travel: 7, axis: 'x', speed: 0.55, length: 2.4, width: 2.2 });
  b.ground(4, { width: 5, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.checkpointHere({ offsetX: 0 });
  b.enemyHere('spiny', { offsetX: 1, range: 1.4 });
  b.starAt(2, 0, 2, '-8-2c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level8_3() {
  const b = new LevelBuilder({ id: '8-3', world: 8, index: 3, name: "Bowser's Approach", theme: 'castle', killY: -12 });
  b.ground(6, { width: 6, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('hammerbro', { offsetX: 4, range: 0 });

  b.gap(2.2);
  b.ground(5, { width: 5, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.enemyHere('chomp', { offsetX: 2, range: 2 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(3.5, 0, 2, '-8-3a');

  b.hazardBelow(5, 'lava');
  b.gap(1);
  b.crumblePath(4, { stepLength: 1.6, width: 2.2, gapWidth: 0.6, delay: 0.5, respawnDelay: 3 });
  b.enemyHere('bobomb', { offsetX: 0, range: 1.2 });
  b.starAt(0, 0, 2, '-8-3b');

  b.ground(5, { width: 5, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.checkpointHere({ offsetX: -1 });
  b.enemyHere('boo', { offsetX: 2, range: 0 });
  b.enemyHere('spiny', { offsetX: 3.5, range: 1.4 });

  b.gap(2.4);
  b.movingPlatform({ travel: 7, axis: 'z', speed: 0.55, length: 2.4, width: 2.4 });
  b.ground(4, { width: 5, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.enemyHere('hammerbro', { offsetX: 1, range: 0 });
  b.starAt(2, 0, 2, '-8-3c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level8_4() {
  const b = new LevelBuilder({ id: '8-4', world: 8, index: 4, name: "Bowser's Last Stand", theme: 'castle', isBoss: true, killY: -12 });
  b.ground(6, { width: 6, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.gap(2);
  b.ground(26, { width: 26, textureType: 'brick', color: 0x5b4a63, uniform: true });
  b.scatterProps(['rock'], 4, { spreadZ: 9 });
  b.starAt(-9, 9, 2, '-8-4a');
  b.starAt(9, -9, 2, '-8-4b');
  b.starAt(0, 0, 7, '-8-4c');
  b.boss = { type: 'bowserFinal', x: b.cursor.x, y: b.cursor.y + 1.6, z: b.cursor.z };
  b.introDialogue = [
    { character: 'bowser', name: 'Bowser', text: 'You made it this far, but this is MY castle!' },
    { character: 'mario', name: 'Mario', text: "It's-a time to finish this, Bowser!" },
  ];
  return b.build();
}

export function buildWorld8() {
  return [level8_1(), level8_2(), level8_3(), level8_4()];
}
