// ---------------------------------------------------------------------------
// A small fluent DSL for authoring levels compactly. Levels progress along
// +X (see CameraRig's fixed heading); Z is the lateral axis used for
// secret branches / width. Every method returns `this` for chaining.
//
// This is THE place to add/change level layouts - each world's level file
// (levels/worlds/world1.js etc.) just chains these calls. No engine code
// needs to change to add a new level.
// ---------------------------------------------------------------------------

let starIdCounter = 0;
let coinIdCounter = 0;

export class LevelBuilder {
  constructor({ id, world, index, name, theme, isBoss = false, isTutorial = false, playerStart = null, killY = -14 }) {
    this.id = id;
    this.world = world;
    this.index = index;
    this.name = name;
    this.theme = theme;
    this.isBoss = isBoss;
    this.isTutorial = isTutorial;
    this.killY = killY;

    this.cursor = { x: 0, y: 0, z: 0 };
    this.platforms = [];
    this.hazards = [];
    this.coins = [];
    this.stars = [];
    this.checkpoints = [];
    this.enemies = [];
    this.props = [];
    this.pipes = [];
    this.npcs = [];
    this.blocks = [];
    this.hintSigns = [];
    this.powerups = [];
    this.bricks = [];
    this.goalSpec = null;
    this.playerStart = playerStart || { x: 0, y: 1, z: 0 };
    this.boss = null;
    this.introDialogue = null;
  }

  // -- ground / gaps ---------------------------------------------------
  // NOTE: default thickness is intentionally huge (a real cliff face, not a
  // thin slab) - the platform's TOP stays exactly where rise/topY put it,
  // but it now extends far downward so static terrain reads as solid
  // ground/mesas/cliffs instead of floating islands. Gaps between ground
  // segments then read as canyons between landmasses, not empty voids.
  // Moving/crumbling platforms deliberately stay thin (see movingPlatform/
  // crumblePath) since those are meant to look like distinct mechanisms.
  ground(length, opts = {}) {
    const sz = opts.width ?? 5;
    const sy = opts.thickness ?? 22;
    const topY = this.cursor.y + (opts.rise ?? 0);
    const cx = this.cursor.x + length / 2;
    this.platforms.push({
      x: cx, y: topY - sy / 2, z: this.cursor.z + (opts.zOffset ?? 0),
      sx: length, sy, sz,
      color: opts.color, textureType: opts.textureType || 'grass', uniform: !!opts.uniform,
      move: opts.move || null,
    });
    this.cursor.x += length;
    this.cursor.y = topY;
    return this;
  }

  gap(width) {
    this.cursor.x += width;
    return this;
  }

  /** A short raised or lowered step (changes cursor.y without a gap). */
  step(length, rise, opts = {}) {
    return this.ground(length, { ...opts, rise });
  }

  /** A sequence of ascending/descending platforms with gaps between (stairs). */
  stairs(steps, { stepLength = 1.8, stepRise = 0.9, width = 4, gapWidth = 0.6, textureType = 'brick', color = 0xc98a3a } = {}) {
    for (let i = 0; i < steps; i++) {
      this.ground(stepLength, { rise: stepRise, width, textureType, color });
      if (i < steps - 1) this.gap(gapWidth);
    }
    return this;
  }

  /** Floating platforms spanning a gap (jump-jump-jump). */
  platformHops(count, { hopLength = 1.9, hopWidth = 3.4, gapWidth = 1.4, textureType = 'speckle', color = 0xd9d9d9, rise = 0 } = {}) {
    const stepRise = rise / Math.max(1, count);
    for (let i = 0; i < count; i++) {
      this.ground(hopLength, { width: hopWidth, textureType, color, rise: stepRise });
      if (i < count - 1) this.gap(gapWidth);
    }
    return this;
  }

  /** A single platform that shuttles back and forth across a gap. */
  movingPlatform({ travel = 6, axis = 'x', speed = 0.6, length = 2.8, width = 3.4, textureType = 'plank', color = 0x9c7040 } = {}) {
    const startX = this.cursor.x + length / 2;
    this.platforms.push({
      x: startX, y: this.cursor.y - 0.3, z: this.cursor.z,
      sx: length, sy: 0.6, sz: width,
      textureType, color,
      move: { axis, distance: travel / 2, speed, phase: 0 },
    });
    this.cursor.x += length + travel;
    return this;
  }

  /** A row of platforms that crumble shortly after being stood on. */
  crumblePath(count, { stepLength = 1.9, width = 3.2, gapWidth = 0.8, delay = 0.7, respawnDelay = 3 } = {}) {
    for (let i = 0; i < count; i++) {
      const cx = this.cursor.x + stepLength / 2;
      this.platforms.push({
        x: cx, y: this.cursor.y - 0.3, z: this.cursor.z,
        sx: stepLength, sy: 0.5, sz: width,
        color: 0xc98a3a, textureType: 'speckle',
        crumble: true, delay, respawnDelay,
      });
      this.cursor.x += stepLength;
      if (i < count - 1) this.gap(gapWidth);
    }
    return this;
  }

  /** Shifts the build lane sideways, so later pieces are placed off-centre. */
  lane(z) {
    this.cursor.z = z;
    return this;
  }

  /**
   * A raised mesa: ramp up, a flat top to fight/explore on, then a ramp back
   * down. Reads as a real landform rather than another floating slab.
   */
  plateau({ rise = 2.4, topLength = 6, width = 6, steps = 3, textureType, color } = {}) {
    const stepRise = rise / steps;
    for (let i = 0; i < steps; i++) this.ground(1.6, { rise: stepRise, width, textureType, color });
    this.ground(topLength, { width, textureType, color });
    return this;
  }

  /** Drops into a dip and climbs back out - the inverse of a plateau. */
  valley({ depth = 2.2, floorLength = 5, width = 5, steps = 2, textureType, color } = {}) {
    const stepRise = -depth / steps;
    for (let i = 0; i < steps; i++) this.ground(1.5, { rise: stepRise, width, textureType, color });
    this.ground(floorLength, { width, textureType, color });
    for (let i = 0; i < steps; i++) this.ground(1.5, { rise: -stepRise, width, textureType, color });
    return this;
  }

  /** Narrow pillars with drops between them - a precision hopping stretch. */
  pillars(count, { width = 2.6, topLength = 1.6, gapWidth = 2, rise = 0, textureType = 'brick', color = 0xc98a3a } = {}) {
    for (let i = 0; i < count; i++) {
      this.ground(topLength, { width, textureType, color, rise: i === 0 ? rise : 0 });
      if (i < count - 1) this.gap(gapWidth);
    }
    return this;
  }

  /** Platforms that alternate side to side, pulling the player across the lane. */
  zigzag(count, { stepLength = 2.4, width = 3.4, gapWidth = 1.2, offsetZ = 2, textureType, color } = {}) {
    const startZ = this.cursor.z;
    for (let i = 0; i < count; i++) {
      this.lane(startZ + (i % 2 === 0 ? -offsetZ : offsetZ));
      this.ground(stepLength, { width, textureType, color });
      if (i < count - 1) this.gap(gapWidth);
    }
    this.lane(startZ);
    return this;
  }

  /** A low overhang the player must crouch under (doesn't block the floor). */
  ceilingBar({ offsetX = 0, length = 2.4, clearance = 1.05, width = 4 } = {}) {
    this.platforms.push({
      x: this.cursor.x + offsetX + length / 2, y: this.cursor.y + clearance + 0.3, z: this.cursor.z,
      sx: length, sy: 0.6, sz: width, textureType: 'brick', color: 0xc98a3a, uniform: true,
    });
    return this;
  }

  // -- hazards -----------------------------------------------------------
  hazardBelow(width, kind = 'lava') {
    this.hazards.push({ x: this.cursor.x + width / 2, y: this.cursor.y - 1.2, z: this.cursor.z, sx: width, sz: 6, kind });
    return this;
  }

  spikesHere({ offsetX = 0, width = 1.6 } = {}) {
    this.hazards.push({ kind: 'spikes', x: this.cursor.x + offsetX, y: this.cursor.y, z: this.cursor.z, sx: width, sz: 1.4 });
    return this;
  }

  /** A chasm with visible spikes at the bottom instead of an empty gap - fall in and it hurts. */
  spikePit(width, { depth = 3.5 } = {}) {
    this.hazards.push({ kind: 'spikepit', x: this.cursor.x + width / 2, y: this.cursor.y - depth, z: this.cursor.z, sx: width, sz: 6 });
    return this;
  }

  // -- pickups -------------------------------------------------------------
  coinRow(count, { offsetX = 0, spacing = 0.9, height = 1.4, arc = false, zOffset = 0 } = {}) {
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      const y = this.cursor.y + height + (arc ? Math.sin(t * Math.PI) * 1.2 : 0);
      this.coins.push({ id: `c${coinIdCounter++}`, x: this.cursor.x + offsetX + i * spacing, y, z: this.cursor.z + zOffset });
    }
    return this;
  }

  coinAt(offsetX, offsetZ = 0, height = 1.4) {
    this.coins.push({ id: `c${coinIdCounter++}`, x: this.cursor.x + offsetX, y: this.cursor.y + height, z: this.cursor.z + offsetZ });
    return this;
  }

  starAt(offsetX, offsetZ = 0, height = 1.6, idSuffix = '') {
    const id = `S${++starIdCounter}${idSuffix}`;
    this.stars.push({ id, x: this.cursor.x + offsetX, y: this.cursor.y + height, z: this.cursor.z + offsetZ });
    return id;
  }

  // -- enemies / npcs -------------------------------------------------------
  enemyHere(type, { offsetX = 0, offsetZ = 0, range = 2.4, height = 0 } = {}) {
    this.enemies.push({ type, x: this.cursor.x + offsetX, y: this.cursor.y + 0.05 + height, z: this.cursor.z + offsetZ, range });
    return this;
  }

  npcHere(character, dialogue, { offsetX = 0, offsetZ = 0, promptText = 'Talk', facing = Math.PI } = {}) {
    this.npcs.push({ character, x: this.cursor.x + offsetX, y: this.cursor.y, z: this.cursor.z + offsetZ, dialogue, promptText, facing });
    return this;
  }

  /** A short tip that appears as a HUD prompt when a player walks near - no NPC needed. */
  hintSignHere(text, { offsetX = 0, offsetZ = 0, rotationY = 0 } = {}) {
    this.hintSigns.push({ x: this.cursor.x + offsetX, y: this.cursor.y, z: this.cursor.z + offsetZ, text, rotationY });
    return this;
  }

  /** Classic ? Lucky Block - bump it from below to pop a coin (or a star). */
  luckyBlockHere({ offsetX = 0, offsetZ = 0, height = 2.6, contents = 'coin' } = {}) {
    this.blocks.push({
      id: `blk${this.blocks.length}`,
      x: this.cursor.x + offsetX, y: this.cursor.y + height, z: this.cursor.z + offsetZ,
      contents,
    });
    return this;
  }

  /** A Fire Flower ('fire') or Mega Mushroom ('mega') sitting on the ground. */
  powerupHere(kind = 'fire', { offsetX = 0, offsetZ = 0, height = 0.5 } = {}) {
    this.powerups.push({
      id: `pw${this.powerups.length}`, kind,
      x: this.cursor.x + offsetX, y: this.cursor.y + height, z: this.cursor.z + offsetZ,
    });
    return this;
  }

  /** A run of breakable bricks - only a Mega player can smash through them. */
  brickRow(count, { offsetX = 0, offsetZ = 0, height = 2.6, spacing = 1 } = {}) {
    for (let i = 0; i < count; i++) {
      this.bricks.push({
        id: `br${this.bricks.length}`,
        x: this.cursor.x + offsetX + i * spacing,
        y: this.cursor.y + height,
        z: this.cursor.z + offsetZ,
      });
    }
    return this;
  }

  checkpointHere({ offsetX = 0, offsetZ = 0 } = {}) {
    this.checkpoints.push({ id: `cp${this.checkpoints.length}`, x: this.cursor.x + offsetX, y: this.cursor.y, z: this.cursor.z + offsetZ });
    return this;
  }

  // -- decoration -----------------------------------------------------------
  // IMPORTANT: cursor.x is the TRAILING (far) edge of the ground segment
  // that was just placed - not its center - because ground() advances the
  // cursor forward as its last step. Scattering with a symmetric +/-offset
  // around cursor.x used to put ~half the props past that edge, floating
  // over the gap beyond. Only scatter BACKWARD (into the platform that was
  // just built) and stay within typical platform width/length.
  scatterProps(kinds, count, { spreadX = 3, spreadZ = 1.6, yOffset = 0 } = {}) {
    for (let i = 0; i < count; i++) {
      const kind = kinds[i % kinds.length];
      this.props.push({
        kind,
        x: this.cursor.x - Math.random() * spreadX,
        y: this.cursor.y + yOffset,
        z: this.cursor.z + (Math.random() - 0.5) * spreadZ,
      });
    }
    return this;
  }

  pipeHere({ offsetX = 0, offsetZ = 0, height = 1.4, color } = {}) {
    this.pipes.push({ x: this.cursor.x + offsetX, y: this.cursor.y, z: this.cursor.z + offsetZ, opts: { height, color } });
    return this;
  }

  // -- meta -----------------------------------------------------------------
  setStart(offsetX = 0, offsetZ = 0, height = 1) {
    this.playerStart = { x: this.cursor.x + offsetX, y: this.cursor.y + height, z: this.cursor.z + offsetZ };
    return this;
  }

  /**
   * `offsetX` is how far BACK from the end of the last ground segment the
   * flagpole stands. cursor.x is that segment's far edge, so adding the
   * offset (as this used to) planted every flagpole in the game 1-2.5 units
   * out past the cliff, hovering over the gap beyond it.
   */
  goalHere({ offsetX = 1 } = {}) {
    this.goalSpec = { x: this.cursor.x - Math.abs(offsetX), y: this.cursor.y, z: this.cursor.z };
    return this;
  }

  // -- placement validation -------------------------------------------------
  // Offsets in this DSL are measured from cursor.x, which is the FAR edge of
  // the ground segment just placed. A positive offset therefore lands past
  // that edge - fine when the next segment is contiguous, but over open air
  // when a gap comes next. Anything that needs solid ground under it then
  // falls out of the world on frame one and reads to the player as simply
  // missing (this is why the tutorial's Spiny was "invisible"). Rather than
  // re-tune every offset across 33 hand-authored levels, the builder proves
  // each such entity is supported and slides the strays onto real ground.

  /** Highest static platform surface at (x,z), or null if nothing holds it up. */
  _groundTopAt(x, z) {
    let best = null;
    for (const p of this.platforms) {
      if (p.crumble || p.move) continue; // can't count on these to be there
      if (x < p.x - p.sx / 2 || x > p.x + p.sx / 2) continue;
      if (z < p.z - p.sz / 2 || z > p.z + p.sz / 2) continue;
      const top = p.y + p.sy / 2;
      if (best === null || top > best) best = top;
    }
    return best;
  }

  /**
   * Slides an unsupported entity onto the closest static platform. `mode`
   * 'ground' reseats it on the surface; 'air' keeps its height above that
   * surface (Lucky Blocks are meant to hover).
   */
  _ensureSupported(entity, mode = 'ground') {
    const existing = this._groundTopAt(entity.x, entity.z);
    if (existing !== null) {
      if (mode === 'ground') entity.y = existing;
      return false;
    }
    let best = null, bestDist = Infinity;
    for (const p of this.platforms) {
      if (p.crumble || p.move) continue;
      const minX = p.x - p.sx / 2 + 0.7, maxX = p.x + p.sx / 2 - 0.7;
      if (maxX <= minX) continue;
      const cx = Math.max(minX, Math.min(entity.x, maxX));
      const d = Math.abs(cx - entity.x);
      if (d < bestDist) { bestDist = d; best = { p, cx }; }
    }
    if (!best) return false;
    const { p, cx } = best;
    const top = p.y + p.sy / 2;
    entity.x = cx;
    entity.z = Math.max(p.z - p.sz / 2 + 0.6, Math.min(entity.z, p.z + p.sz / 2 - 0.6));
    entity.y = mode === 'air' ? top + (entity.y - top > 0 ? entity.y - top : 2.6) : top;
    return true;
  }

  _validatePlacements() {
    let moved = 0;
    // Flying enemies are supposed to hang in the air over gaps.
    const airborne = new Set(['paragoomba', 'cheep', 'lakitu', 'boo']);
    for (const e of this.enemies) if (!airborne.has(e.type)) moved += this._ensureSupported(e) ? 1 : 0;
    for (const n of this.npcs) moved += this._ensureSupported(n) ? 1 : 0;
    for (const s of this.hintSigns) moved += this._ensureSupported(s) ? 1 : 0;
    for (const c of this.checkpoints) moved += this._ensureSupported(c) ? 1 : 0;
    for (const p of this.pipes) moved += this._ensureSupported(p) ? 1 : 0;
    // Clouds are meant to be in the sky; everything else planted on a
    // surface (trees, bushes, rocks, flowers, signs) must have one.
    for (const p of this.props) if (p.kind !== 'cloud') moved += this._ensureSupported(p) ? 1 : 0;
    for (const b of this.blocks) moved += this._ensureSupported(b, 'air') ? 1 : 0;
    for (const b of this.bricks) moved += this._ensureSupported(b, 'air') ? 1 : 0;
    for (const w of this.powerups) moved += this._ensureSupported(w, 'air') ? 1 : 0;
    if (this.goalSpec) moved += this._ensureSupported(this.goalSpec) ? 1 : 0;
    return moved;
  }

  build() {
    this._validatePlacements();

    // Invisible walls boxing in the playable area on all four sides. With a
    // fixed side-on camera you cannot judge depth, so walking off the front
    // or back edge into the void feels like a glitch rather than a mistake -
    // these keep the player on the level without any visible cage.
    //
    // cursor.x only ever increases (ground/gap/stairs all advance forward),
    // so 0..cursor.x is the level's full length; the lateral bounds come
    // from the widest platform actually placed.
    let minZ = -2.5, maxZ = 2.5;
    for (const p of this.platforms) {
      minZ = Math.min(minZ, p.z - p.sz / 2);
      maxZ = Math.max(maxZ, p.z + p.sz / 2);
    }
    // Park the camera clear of the widest thing in the level.
    const cameraOffset = Math.max(13, maxZ + 7);
    const lengthX = this.cursor.x + 8;
    const spanZ = maxZ - minZ + 8;
    const midZ = (minZ + maxZ) / 2;
    const boundaryWalls = [
      { x: -2, y: 5, z: midZ, sx: 3, sy: 44, sz: spanZ },              // behind the start
      { x: this.cursor.x + 4, y: 5, z: midZ, sx: 3, sy: 44, sz: spanZ }, // past the goal
      { x: lengthX / 2 - 4, y: 5, z: minZ - 1.5, sx: lengthX, sy: 44, sz: 3 },
      { x: lengthX / 2 - 4, y: 5, z: maxZ + 1.5, sx: lengthX, sy: 44, sz: 3 },
    ];

    return {
      id: this.id, world: this.world, index: this.index, name: this.name, theme: this.theme,
      isBoss: this.isBoss, isTutorial: this.isTutorial, killY: this.killY,
      playerStart: this.playerStart,
      platforms: this.platforms, hazards: this.hazards, boundaryWalls, cameraOffset,
      coins: this.coins, stars: this.stars, checkpoints: this.checkpoints,
      enemies: this.enemies, props: this.props, pipes: this.pipes, npcs: this.npcs,
      blocks: this.blocks, hintSigns: this.hintSigns,
      powerups: this.powerups, bricks: this.bricks,
      goal: this.goalSpec, boss: this.boss, introDialogue: this.introDialogue,
    };
  }
}
