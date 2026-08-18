import { STORAGE_KEY } from './Config.js';

// ---------------------------------------------------------------------------
// Simple local save system. No accounts, no server - just localStorage.
// Tracks unlocked worlds, per-level completion + stars, and coin total.
// ---------------------------------------------------------------------------

function defaultSave() {
  return {
    unlockedWorlds: [1],
    levels: {}, // { '1-1': { completed: true, stars: ['S1','S2'], bestCoins: 12 } }
    totalCoins: 0,
    tutorialDone: false,
    storySeen: {}, // { world1_intro: true, ... }
    characters: { p1: 'mario', p2: 'luigi' },
  };
}

export const PLAYABLE_CHARACTERS = [
  { key: 'mario', name: 'Mario', blurb: 'All-round balanced' },
  { key: 'luigi', name: 'Luigi', blurb: 'The taller brother' },
  { key: 'peach', name: 'Peach', blurb: 'Royal and graceful' },
  { key: 'daisy', name: 'Daisy', blurb: 'Bold and sporty' },
];

class SaveSystemImpl {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      return { ...defaultSave(), ...parsed };
    } catch (e) {
      console.warn('[SaveSystem] failed to load save, using defaults', e);
      return defaultSave();
    }
  }

  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[SaveSystem] failed to persist save', e);
    }
  }

  /**
   * `indexInWorld` is 1-BASED (level 1-1 passes 1). The first level of a
   * world unlocks with the world itself; every later level needs the one
   * before it finished. Getting this off by one made 1-1 require 1-1 to
   * already be complete - an unopenable gate.
   */
  isLevelUnlocked(levelId, worldNum, indexInWorld) {
    if (indexInWorld <= 1) return this.data.unlockedWorlds.includes(worldNum);
    const prevId = `${worldNum}-${indexInWorld - 1}`;
    return !!this.data.levels[prevId]?.completed;
  }

  getCharacter(playerId) {
    return this.data.characters?.[playerId] || (playerId === 'p2' ? 'luigi' : 'mario');
  }

  setCharacter(playerId, key) {
    if (!this.data.characters) this.data.characters = {};
    this.data.characters[playerId] = key;
    this.persist();
  }

  getLevelProgress(levelId) {
    return this.data.levels[levelId] || { completed: false, stars: [], bestCoins: 0 };
  }

  recordLevelComplete(levelId, starsCollected, coinsCollected, worldNum, isLastInWorld) {
    const existing = this.getLevelProgress(levelId);
    const mergedStars = Array.from(new Set([...(existing.stars || []), ...starsCollected]));
    this.data.levels[levelId] = {
      completed: true,
      stars: mergedStars,
      bestCoins: Math.max(existing.bestCoins || 0, coinsCollected),
    };
    if (isLastInWorld && worldNum < 8 && !this.data.unlockedWorlds.includes(worldNum + 1)) {
      this.data.unlockedWorlds.push(worldNum + 1);
    }
    this.persist();
  }

  addCoins(n) {
    this.data.totalCoins += n;
    this.persist();
  }

  markTutorialDone() {
    this.data.tutorialDone = true;
    this.persist();
  }

  markStorySeen(key) {
    if (this.data.storySeen[key]) return;
    this.data.storySeen[key] = true;
    this.persist();
  }

  hasSeenStory(key) {
    return !!this.data.storySeen[key];
  }

  totalStarsForWorld(worldNum) {
    let count = 0;
    for (let i = 1; i <= 4; i++) {
      const lvl = this.data.levels[`${worldNum}-${i}`];
      if (lvl) count += lvl.stars.length;
    }
    return count;
  }

  resetAll() {
    this.data = defaultSave();
    this.persist();
  }
}

export const SaveSystem = new SaveSystemImpl();
