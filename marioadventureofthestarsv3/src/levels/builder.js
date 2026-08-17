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
  platformHops(count, { hopLength = 1.6, hopWidth = 2.2, gapWidth = 1.4, textureType = 'speckle', color = 0xd9d9d9, rise = 0 } = {}) {
    const stepRise = rise / Math.max(1, count);
    for (let i = 0; i < count; i++) {
      this.ground(hopLength, { width: hopWidth, textureType, color, rise: stepRise });
      if (i < count - 1) this.gap(gapWidth);
    }
    return this;
  }

  /** A single platform that shuttles back and forth across a gap. */
  movingPlatform({ travel = 6, axis = 'x', speed = 0.6, length = 2.4, width = 2.4, textureType = 'plank', color = 0x9c7040 } = {}) {
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
  crumblePath(count, { stepLength = 1.8, width = 2.2, gapWidth = 0.8, delay = 0.7, respawnDelay = 3 } = {}) {
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

  goalHere({ offsetX = 1 } = {}) {
    this.goalSpec = { x: this.cursor.x + offsetX, y: this.cursor.y, z: this.cursor.z };
    return this;
  }

  build() {
    // cursor.x only ever increases (ground/gap/stairs all advance forward),
    // so x=0 is always the true leftmost edge of the level - an invisible
    // wall there stops the player from wandering backward off the start
    // into the void. No mesh, so it never affects the visuals.
    const boundaryWalls = [{ x: -2, y: 5, z: 0, sx: 3, sy: 44, sz: 60 }];

    return {
      id: this.id, world: this.world, index: this.index, name: this.name, theme: this.theme,
      isBoss: this.isBoss, isTutorial: this.isTutorial, killY: this.killY,
      playerStart: this.playerStart,
      platforms: this.platforms, hazards: this.hazards, boundaryWalls,
      coins: this.coins, stars: this.stars, checkpoints: this.checkpoints,
      enemies: this.enemies, props: this.props, pipes: this.pipes, npcs: this.npcs,
      blocks: this.blocks, hintSigns: this.hintSigns,
      goal: this.goalSpec, boss: this.boss, introDialogue: this.introDialogue,
    };
  }
}
