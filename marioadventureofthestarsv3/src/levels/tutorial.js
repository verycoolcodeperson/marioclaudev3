import { LevelBuilder } from './builder.js';

const TOAD_WELCOME = [
  { character: 'toad', name: 'Toad', text: "Hiya! I'm Toad. Let's learn the ropes before your big adventure!" },
  { character: 'toad', name: 'Toad', text: 'Use WASD (or Arrow Keys for Player 2) to move, and SPACE to jump.' },
  { character: 'toad', name: 'Toad', text: 'Look for my hint signs along the way for more tips. Good luck!' },
];
const TOAD_SEND_OFF = [
  { character: 'toad', name: 'Toad', text: 'Every level hides 3 Power Stars. Some are easy, some are sneaky!' },
  { character: 'toad', name: 'Toad', text: "You're all set. Go get 'em, Mario!" },
];

export function buildTutorialLevel() {
  const b = new LevelBuilder({ id: 'tutorial', world: 0, index: 0, name: "Toad's Lesson", theme: 'grassland', isTutorial: true, killY: -12 });

  b.ground(7, { width: 7 });
  b.setStart(-2, 0, 1);
  b.npcHere('toad', TOAD_WELCOME, { offsetX: -1.5, promptText: 'Talk to Toad' });
  b.coinRow(3, { offsetX: 2, height: 1.2 });
  b.luckyBlockHere({ offsetX: 4.5 });

  b.gap(2.6); // easy jump
  b.ground(4, { width: 5 });
  b.coinRow(2, { offsetX: 1, height: 1.2 });
  b.luckyBlockHere({ offsetX: 2.5 });

  b.gap(3.2); // slightly bigger jump
  b.ground(5, { width: 5 });
  b.hintSignHere('Gap too wide? Press JUMP again in mid-air for a Double Jump!', { offsetX: 0, offsetZ: 1.8 });
  b.checkpointHere({ offsetX: 0 });

  b.spikePit(9.5, { depth: 3 }); // requires double jump to clear
  b.ground(5, { width: 5 });
  b.starAt(0, 0, 2.2, '-tut-a');

  b.ground(4, { width: 5 });
  b.hintSignHere('Hold BACK while standing still to crouch under low ledges.', { offsetX: 0, offsetZ: 1.8 });
  b.ceilingBar({ offsetX: 2.2, length: 2.6, clearance: 1.0, width: 5 });
  b.ground(3, { width: 5 });

  b.ground(4, { width: 5 });
  b.hintSignHere('Press ACTION in mid-air to Ground Pound - try it on that block!', { offsetX: 0, offsetZ: 1.8 });
  b.platforms.push({ x: b.cursor.x + 2, y: b.cursor.y + 0.5, z: b.cursor.z, sx: 1.2, sy: 1, sz: 1.2, textureType: 'brick', color: 0xc98a3a, uniform: true, crumble: true, delay: 0, respawnDelay: 2.5 });
  b.gap(0.001);
  b.ground(3, { width: 5 });
  b.checkpointHere({ offsetX: 0 });

  b.ground(5, { width: 5 });
  b.hintSignHere('Jump ON a Goomba to stomp it, or press ACTION on the ground to punch.', { offsetX: 0, offsetZ: 1.8 });
  b.enemyHere('goomba', { offsetX: 2, range: 1.4 });
  b.coinRow(3, { offsetX: 0.5, height: 1.2, spacing: 0.8 });

  b.ground(5, { width: 5 });
  b.hintSignHere("That Spiny hurts if you stomp it - punch it, ground pound it, or jump over!", { offsetX: 0, offsetZ: 1.8 });
  b.enemyHere('spiny', { offsetX: 2, range: 1.2 });
  b.starAt(4, 0, 2, '-tut-b');

  b.gap(2.4);
  b.ground(6, { width: 6 });
  b.hintSignHere('Touch checkpoint flags to save your spot!', { offsetX: -1, offsetZ: 1.8 });
  b.checkpointHere({ offsetX: 0 });
  b.npcHere('toad', TOAD_SEND_OFF, { offsetX: 2.5, offsetZ: -1.6, promptText: 'Talk to Toad' });
  b.starAt(4.5, 0, 2, '-tut-c');
  b.scatterProps(['tree', 'flower', 'bush'], 6);

  b.gap(2.2);
  b.ground(4, { width: 6 });
  b.goalHere({ offsetX: 1 });

  return b.build();
}
