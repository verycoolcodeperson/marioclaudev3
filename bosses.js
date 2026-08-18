// ---------------------------------------------------------------------------
// The 8 world bosses. Each is just a config fed into the shared Boss engine
// (entities/Boss.js) - a name, color/decoration, an arena size, and which
// shared attack moves to use per phase. This is the one file to touch to
// add or tweak a boss; no new code is needed elsewhere.
// ---------------------------------------------------------------------------
export const BOSS_CONFIGS = {
  grandGoomba: {
    name: 'Grand Goomba', color: 0x6b4a2b, decoration: 'horns', scale: 2.1,
    arenaRadius: 9, phases: 2, hitsPerPhase: 3, vulnerableDuration: 3,
    moves: ['charge', 'groundSlam'],
    phaseMoves: { 2: ['charge', 'charge', 'groundSlam'] },
  },
  sandSphinx: {
    name: 'Sandshell Sphinx', color: 0xd9b25c, decoration: 'crown', scale: 2.0,
    arenaRadius: 10, phases: 2, hitsPerPhase: 3, vulnerableDuration: 3.2,
    moves: ['summon', 'projectile', 'charge'], summonType: 'goomba', summonCount: 2, projectileType: 'rock',
    phaseMoves: { 2: ['projectile', 'summon', 'charge', 'projectile'] },
  },
  frostYeti: {
    name: 'Frost Yeti', color: 0xdff2ff, decoration: 'icecrown', scale: 2.2,
    arenaRadius: 9.5, phases: 2, hitsPerPhase: 3, vulnerableDuration: 3,
    moves: ['groundSlam', 'charge'], projectileType: 'rock',
    phaseMoves: { 2: ['groundSlam', 'charge', 'charge'] },
  },
  thornback: {
    name: 'Thornback Beast', color: 0x4a7d3c, decoration: 'shell', scale: 2.1,
    arenaRadius: 9.5, phases: 2, hitsPerPhase: 3, vulnerableDuration: 3,
    moves: ['charge', 'shockwave', 'summon'], summonType: 'spiny', summonCount: 2,
    phaseMoves: { 2: ['charge', 'shockwave', 'charge', 'summon'] },
  },
  krakenTide: {
    name: 'Kraken Tide', color: 0x1a8fa8, decoration: 'wings', scale: 2.2,
    arenaRadius: 10.5, phases: 2, hitsPerPhase: 3, vulnerableDuration: 3.2,
    moves: ['projectile', 'shockwave', 'summon'], summonType: 'cheep', summonCount: 2, projectileType: 'orb',
    phaseMoves: { 2: ['projectile', 'projectile', 'shockwave', 'summon'] },
  },
  cinderGolem: {
    name: 'Cinder Golem', color: 0xff6a29, decoration: 'horns', scale: 2.3,
    arenaRadius: 10, phases: 2, hitsPerPhase: 3, vulnerableDuration: 2.8,
    moves: ['groundSlam', 'projectile', 'charge'], projectileType: 'fireball',
    phaseMoves: { 2: ['charge', 'groundSlam', 'projectile', 'charge'] },
  },
  skyGriffin: {
    name: 'Sky Griffin', color: 0xffe066, decoration: 'wings', scale: 2.0,
    arenaRadius: 10.5, phases: 2, hitsPerPhase: 3, vulnerableDuration: 3,
    moves: ['jumpAttack', 'projectile', 'charge'], projectileType: 'fireball',
    phaseMoves: { 2: ['jumpAttack', 'jumpAttack', 'projectile', 'charge'] },
  },
  bowserFinal: {
    name: 'Bowser', color: 0x2f8a3a, decoration: 'horns', scale: 2.6,
    arenaRadius: 12, phases: 3, hitsPerPhase: 3, vulnerableDuration: 2.8,
    moves: ['groundSlam', 'charge'],
    phaseMoves: {
      2: ['charge', 'projectile', 'groundSlam', 'summon'],
      3: ['charge', 'charge', 'projectile', 'groundSlam', 'summon'],
    },
    summonType: 'koopa', summonCount: 2, projectileType: 'fireball',
  },
};
