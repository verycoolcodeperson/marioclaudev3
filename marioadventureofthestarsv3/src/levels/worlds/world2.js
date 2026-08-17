import { LevelBuilder } from '../builder.js';

// World 2 - Dustdune Wastes (desert). Introduces sand-pit pits (fall
// hazards), Koopas, and Hammer Bros.

function level2_1() {
  const b = new LevelBuilder({ id: '2-1', world: 2, index: 1, name: 'Dune Crossing', theme: 'desert', killY: -12 });
  b.ground(6, { width: 6, textureType: 'speckle' });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('goomba', { offsetX: 4, range: 1.8 });

  b.gap(3);
  b.ground(4, { width: 5, textureType: 'speckle' });
  b.enemyHere('koopa', { offsetX: 2, range: 3 });
  b.starAt(3, 0, 2, '-2-1a');

  b.gap(3.4);
  b.platformHops(3, { hopLength: 1.6, hopWidth: 2.2, gapWidth: 1.8 });
  b.checkpointHere({ offsetX: 0 });
  b.coinRow(4, { offsetX: 0, spacing: 1.6, height: 1.4, arc: true });

  b.gap(2.4);
  b.ground(5, { width: 6, textureType: 'speckle' });
  b.enemyHere('koopa', { offsetX: 1, range: 2.5 });
  b.enemyHere('goomba', { offsetX: 3.5, range: 1.4 });
  b.starAt(2, -2.2, 2, '-2-1b');

  b.gap(2.6);
  b.ground(4, { width: 5, textureType: 'speckle' });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(2, 0, 2.4, '-2-1c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle' });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level2_2() {
  const b = new LevelBuilder({ id: '2-2', world: 2, index: 2, name: 'Pyramid Steps', theme: 'desert', killY: -12 });
  b.ground(5, { width: 6, textureType: 'brick', color: 0xd9b25c });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });

  b.stairs(5, { stepLength: 1.8, stepRise: 0.85, width: 5, gapWidth: 0.5, textureType: 'brick', color: 0xd9b25c });
  b.enemyHere('koopa', { offsetX: 0, range: 2 });
  b.starAt(0, 0, 2.4, '-2-2a');

  b.ground(4, { width: 5, textureType: 'brick', color: 0xd9b25c });
  b.checkpointHere({ offsetX: -1 });
  b.enemyHere('hammerbro', { offsetX: 2, range: 0 });

  b.gap(2.2);
  b.ground(5, { width: 5, textureType: 'brick', color: 0xd9b25c });
  b.starAt(1, 2.2, 1.8, '-2-2b');
  b.coinRow(3, { offsetX: 2, spacing: 0.8, height: 1.4 });

  b.stairs(4, { stepLength: 1.8, stepRise: -0.8, width: 5, gapWidth: 0.5, textureType: 'brick', color: 0xd9b25c });
  b.checkpointHere({ offsetX: 0 });
  b.enemyHere('goomba', { offsetX: 0, range: 1.6 });
  b.starAt(0, 0, 2, '-2-2c');

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'brick', color: 0xd9b25c });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level2_3() {
  const b = new LevelBuilder({ id: '2-3', world: 2, index: 3, name: 'Cactus Canyon', theme: 'desert', killY: -12 });
  b.ground(6, { width: 6, textureType: 'speckle' });
  b.setStart(-1, 0, 1);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.enemyHere('spiny', { offsetX: 4, range: 1.6 });

  b.gap(2.2);
  b.movingPlatform({ travel: 7, axis: 'z', speed: 0.5, length: 2.4, width: 2.4 });
  b.ground(4, { width: 5, textureType: 'speckle' });
  b.checkpointHere({ offsetX: 0 });
  b.starAt(2, 0, 2.2, '-2-3a');

  b.gap(2);
  b.movingPlatform({ travel: 6, axis: 'y', speed: 0.4, length: 2.2, width: 2.2 });
  b.ground(5, { width: 6, textureType: 'speckle' });
  b.enemyHere('hammerbro', { offsetX: 2, range: 0 });
  b.enemyHere('spiny', { offsetX: 4, range: 1.2 });
  b.starAt(3, -2, 2, '-2-3b');

  b.gap(2.6);
  b.platformHops(4, { hopLength: 1.6, hopWidth: 2, gapWidth: 1.8 });
  b.checkpointHere({ offsetX: 0 });
  b.coinRow(4, { offsetX: 0, spacing: 1.4, height: 1.3, arc: true });

  b.gap(2);
  b.ground(5, { width: 6, textureType: 'speckle' });
  b.enemyHere('koopa', { offsetX: 2, range: 2.5 });
  b.starAt(3.5, 1.8, 2, '-2-3c');

  b.gap(1.8);
  b.ground(4, { width: 6, textureType: 'speckle' });
  b.goalHere({ offsetX: 1 });
  return b.build();
}

function level2_4() {
  const b = new LevelBuilder({ id: '2-4', world: 2, index: 4, name: 'Temple of the Sphinx', theme: 'desert', isBoss: true, killY: -12 });
  b.ground(6, { width: 6, textureType: 'brick', color: 0xd9b25c });
  b.setStart(-1, 0, 0);
  b.coinRow(3, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 3 });
  b.gap(2);
  b.ground(24, { width: 24, textureType: 'brick', color: 0xd9b25c });
  b.scatterProps(['rock'], 6, { spreadZ: 9 });
  b.starAt(-8, 8, 2, '-2-4a');
  b.starAt(8, -8, 2, '-2-4b');
  b.starAt(0, 0, 7, '-2-4c');
  b.boss = { type: 'sandSphinx', x: b.cursor.x, y: b.cursor.y + 1.4, z: b.cursor.z };
  b.introDialogue = [
    { character: 'mario', name: 'Mario', text: 'A giant sphinx made of sand?!' },
    { character: 'toad', name: 'Toad', text: "Watch for its scarabs, and dodge those rock throws!" },
  ];
  return b.build();
}

export function buildWorld2() {
  return [level2_1(), level2_2(), level2_3(), level2_4()];
}
