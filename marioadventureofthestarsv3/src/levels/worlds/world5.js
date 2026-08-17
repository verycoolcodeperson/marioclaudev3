import { LevelBuilder } from '../builder.js';

// World 5 - Coral Cove (ocean). Introduces Cheep Cheeps and water hazard
// zones alongside crumbling tide-pool platforms.

function level5_1() {
  const b = new LevelBuilder({ id: '5-1', world: 5, index: 1, name: 'Coral Shallows', theme: 'ocean', killY: -10 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0xe8d6a0 });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.hazardBelow(4, 'water');

  b.gap(1);
  b.platformHops(3, { hopLength: 1.8, hopWidth: 2.4, gapWidth: 1.6 });
  b.enemyHere('cheep', { offsetX: 0, range: 0 });
  b.checkpointHere({ offsetX: 0 });

  b.hazardBelow(5, 'water');
  b.gap(1);
  b.movingPlatform({ travel: 6, axis: 'x', speed: 0.5, length: 2.6, width: 2.4 });
  b.starAt(0, 0, 2, '-5-1a');
  b.ground(4, { width: 5, textureType: 'speckle', color: 0xe8d6a0 });

  b.hazardBelow(4, 'water');
  b.gap(1);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xe8d6a0 });
  b.enemyHere('cheep', { offsetX: 2, range: 0 });
  b.starAt(3, -2, 2, '-5-1b');
  b.checkpointHere({ offsetX: 0 });

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xe8d6a0 });
  b.starAt(2, 2, 2.2, '-5-1c');
  b.goalHere({ offsetX: 2.5 });
  return b.build();
}

function level5_2() {
  const b = new LevelBuilder({ id: '5-2', world: 5, index: 2, name: 'Tide Pools', theme: 'ocean', killY: -10 });
  b.ground(6, { width: 6, textureType: 'speckle', color: 0xe8d6a0 });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('lakitu', { offsetX: 4, range: 0 });

  b.hazardBelow(5, 'water');
  b.gap(1);
  b.crumblePath(4, { stepLength: 1.6, width: 2.2, gapWidth: 0.5, delay: 0.6, respawnDelay: 3 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(0, 0, 2, '-5-2a');

  b.hazardBelow(6, 'water');
  b.gap(1);
  b.movingPlatform({ travel: 7, axis: 'z', speed: 0.5, length: 2.6, width: 2.4 });
  b.ground(4, { width: 5, textureType: 'speckle', color: 0xe8d6a0 });
  b.enemyHere('cheep', { offsetX: 1, range: 0 });
  b.starAt(2, 0, 2, '-5-2b');

  b.hazardBelow(4, 'water');
  b.gap(1);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xe8d6a0 });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(3, 2, 2, '-5-2c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle', color: 0xe8d6a0 });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level5_3() {
  const b = new LevelBuilder({ id: '5-3', world: 5, index: 3, name: 'Shipwreck Cove', theme: 'ocean', killY: -10 });
  b.ground(6, { width: 6, textureType: 'plank' });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('hammerbro', { offsetX: 4, range: 0 });

  b.hazardBelow(5, 'water');
  b.gap(1);
  b.movingPlatform({ travel: 7, axis: 'x', speed: 0.55, length: 2.6, width: 2.4, textureType: 'plank' });
  b.ground(4, { width: 5, textureType: 'plank' });
  b.checkpointHere({ offsetX: 0 });
  b.pipeHere({ offsetX: 2, offsetZ: 1.6, height: 1.2 });
  b.enemyHere('piranha', { offsetX: 2, offsetZ: 1.6, range: 0 });

  b.hazardBelow(5, 'water');
  b.gap(1);
  b.platformHops(4, { hopLength: 1.6, hopWidth: 2.2, gapWidth: 1.6, textureType: 'plank' });
  b.starAt(0, 0, 2, '-5-3a');
  b.enemyHere('cheep', { offsetX: 0, range: 0 });

  b.ground(5, { width: 6, textureType: 'plank' });
  b.checkpointHere({ offsetX: -1 });
  b.enemyHere('spiny', { offsetX: 2, range: 1.4 });
  b.starAt(3.5, -2, 2, '-5-3b');

  b.hazardBelow(5, 'water');
  b.gap(1);
  b.movingPlatform({ travel: 6, axis: 'z', speed: 0.5, length: 2.4, width: 2.2, textureType: 'plank' });
  b.ground(5, { width: 6, textureType: 'plank' });
  b.starAt(2, 0, 2.2, '-5-3c');
  b.goalHere({ offsetX: 2 });
  return b.build();
}

function level5_4() {
  const b = new LevelBuilder({ id: '5-4', world: 5, index: 4, name: 'Lair of the Kraken', theme: 'ocean', isBoss: true, killY: -10 });
  b.ground(6, { width: 6, textureType: 'plank' });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.gap(2);
  b.ground(24, { width: 24, textureType: 'speckle', color: 0xe8d6a0 });
  b.scatterProps(['rock'], 5, { spreadZ: 9 });
  b.starAt(-8, 8, 2, '-5-4a');
  b.starAt(8, -8, 2, '-5-4b');
  b.starAt(0, 0, 7, '-5-4c');
  b.boss = { type: 'krakenTide', x: b.cursor.x, y: b.cursor.y + 1.4, z: b.cursor.z };
  b.introDialogue = [
    { character: 'peach', name: 'Peach (radio)', text: 'Mario, the Kraken guards a Star deep in the cove!' },
    { character: 'mario', name: 'Mario', text: 'Time to dive in!' },
  ];
  return b.build();
}

export function buildWorld5() {
  return [level5_1(), level5_2(), level5_3(), level5_4()];
}
