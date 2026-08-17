import { LevelBuilder } from '../builder.js';

// World 6 - Cinderpeak Caldera (lava). Highest difficulty before the sky
// and castle worlds - lava kill-zones, Bob-ombs, and Chain Chomps.

function level6_1() {
  const b = new LevelBuilder({ id: '6-1', world: 6, index: 1, name: 'Magma Fields', theme: 'lava', killY: -8 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0x4a3226 });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('bobomb', { offsetX: 4, range: 1.6 });

  b.hazardBelow(4, 'lava');
  b.gap(1);
  b.platformHops(3, { hopLength: 1.6, hopWidth: 2.2, gapWidth: 1.6, textureType: 'speckle', color: 0x4a3226 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(0, 0, 2, '-6-1a');

  b.hazardBelow(5, 'lava');
  b.gap(1);
  b.movingPlatform({ travel: 6, axis: 'x', speed: 0.55, length: 2.4, width: 2.4 });
  b.ground(4, { width: 5, textureType: 'speckle', color: 0x4a3226 });
  b.enemyHere('bobomb', { offsetX: 2, range: 1.4 });
  b.starAt(2.5, 0, 2, '-6-1b');

  b.hazardBelow(4, 'lava');
  b.gap(1);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0x4a3226 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(3, 2, 2, '-6-1c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0x4a3226 });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level6_2() {
  const b = new LevelBuilder({ id: '6-2', world: 6, index: 2, name: 'Ember Caverns', theme: 'lava', killY: -8 });
  b.ground(5, { width: 6, textureType: 'brick', color: 0x6b4a3a });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('chomp', { offsetX: 4, range: 2.4 });

  b.hazardBelow(5, 'lava');
  b.gap(1);
  b.movingPlatform({ travel: 6, axis: 'z', speed: 0.5, length: 2.4, width: 2.4 });
  b.ground(4, { width: 5, textureType: 'brick', color: 0x6b4a3a });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(1, 0, 2, '-6-2a');

  b.hazardBelow(6, 'lava');
  b.gap(1);
  b.movingPlatform({ travel: 7, axis: 'y', speed: 0.4, length: 2.4, width: 2.4 });
  b.ground(4, { width: 5, textureType: 'brick', color: 0x6b4a3a });
  b.enemyHere('bobomb', { offsetX: 1, range: 1.4 });
  b.starAt(2, 0, 2, '-6-2b');

  b.hazardBelow(5, 'lava');
  b.gap(1);
  b.crumblePath(3, { stepLength: 1.8, width: 2.4, gapWidth: 0.6, delay: 0.5, respawnDelay: 3.2 });
  b.checkpointHere({ offsetX: 0 });
  b.enemyHere('chomp', { offsetX: 0, range: 2 });
  b.starAt(0, 0, 2, '-6-2c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'brick', color: 0x6b4a3a });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level6_3() {
  const b = new LevelBuilder({ id: '6-3', world: 6, index: 3, name: 'Volcano Ascent', theme: 'lava', killY: -8 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0x4a3226 });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('hammerbro', { offsetX: 4, range: 0 });

  b.stairs(4, { stepLength: 1.6, stepRise: 0.8, width: 5, gapWidth: 0.6, textureType: 'speckle', color: 0x4a3226 });
  b.enemyHere('spiny', { offsetX: 0, range: 1.4 });
  b.starAt(0, 0, 2.2, '-6-3a');

  b.ground(4, { width: 5, textureType: 'speckle', color: 0x4a3226 });
  b.checkpointHere({ offsetX: -1 });

  b.hazardBelow(5, 'lava');
  b.gap(1);
  b.crumblePath(4, { stepLength: 1.6, width: 2.2, gapWidth: 0.6, delay: 0.5, respawnDelay: 3 });
  b.enemyHere('bobomb', { offsetX: 0, range: 1.2 });
  b.starAt(0, 0, 2, '-6-3b');

  b.ground(5, { width: 5, textureType: 'speckle', color: 0x4a3226 });
  b.checkpointHere({ offsetX: 0 });
  b.enemyHere('chomp', { offsetX: 2, range: 2 });

  b.hazardBelow(6, 'lava');
  b.gap(1);
  b.movingPlatform({ travel: 7, axis: 'x', speed: 0.55, length: 2.4, width: 2.4 });
  b.ground(4, { width: 6, textureType: 'speckle', color: 0x4a3226 });
  b.starAt(2, 0, 2, '-6-3c');
  b.goalHere({ offsetX: 2 });
  return b.build();
}

function level6_4() {
  const b = new LevelBuilder({ id: '6-4', world: 6, index: 4, name: "Cinder Golem's Forge", theme: 'lava', isBoss: true, killY: -8 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0x4a3226 });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.gap(2);
  b.ground(23, { width: 23, textureType: 'speckle', color: 0x4a3226 });
  b.scatterProps(['rock'], 6, { spreadZ: 8 });
  b.starAt(-7, 7, 2, '-6-4a');
  b.starAt(7, -7, 2, '-6-4b');
  b.starAt(0, 0, 6, '-6-4c');
  b.boss = { type: 'cinderGolem', x: b.cursor.x, y: b.cursor.y + 1.4, z: b.cursor.z };
  b.introDialogue = [
    { character: 'mario', name: 'Mario', text: 'A Golem made of molten rock! This is gonna be hot.' },
    { character: 'toad', name: 'Toad', text: "Dodge the fireballs, then punch back when it's dazed!" },
  ];
  return b.build();
}

export function buildWorld6() {
  return [level6_1(), level6_2(), level6_3(), level6_4()];
}
