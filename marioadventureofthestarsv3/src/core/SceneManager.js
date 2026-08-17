// ---------------------------------------------------------------------------
// Swaps between top-level "screens" (Title, Hub map, Gameplay, ...).
// Each screen is a small class with: init(), update(dt), render(renderer),
// onResize(w,h), dispose(). Only one is active at a time.
//
// Call `SceneManager.goto('sceneName', payload)` from anywhere to change
// screens - the registry is populated once in main.js.
// ---------------------------------------------------------------------------
export class SceneManager {
  constructor() {
    this.registry = new Map();
    this.current = null;
    this.currentName = null;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  register(name, factory) {
    this.registry.set(name, factory);
  }

  async goto(name, payload = {}) {
    const factory = this.registry.get(name);
    if (!factory) {
      console.error(`[SceneManager] Unknown scene "${name}"`);
      return;
    }
    const prev = this.current;
    const next = factory();
    next.sceneManager = this;
    this.current = null;
    this.currentName = name;
    try {
      await next.init(payload);
    } catch (e) {
      console.error(`[SceneManager] Failed to init scene "${name}"`, e);
    }
    if (prev && prev.dispose) {
      try { prev.dispose(); } catch (e) { console.warn('[SceneManager] dispose error', e); }
    }
    next.onResize?.(this.width, this.height);
    this.current = next;
  }

  /**
   * High-level helper: enter a level, and wire up where control returns to
   * (world map / hub) on quit, restart, or completion. Scenes call this
   * instead of poking `gameplay` + navigation logic themselves.
   */
  startLevel(levelSpec, opts = {}) {
    const { multiplayer = false, returnTo = { mode: 'hub' } } = opts;
    this.goto('gameplay', {
      levelSpec,
      multiplayer,
      onExit: (result) => {
        if (result?.type === 'restart') {
          this.startLevel(levelSpec, opts);
        } else {
          this.goto('worldmap', returnTo);
        }
      },
      onLevelComplete: (result) => {
        if (result.levelId === '8-4') {
          this.goto('ending', {});
          return;
        }
        this.goto('worldmap', {
          ...returnTo,
          cameFrom: { justCompletedLevel: result.levelId, isLastInWorld: result.isLastInWorld, world: result.world },
        });
      },
    });
  }

  onResize(w, h) {
    this.width = w;
    this.height = h;
    this.current?.onResize?.(w, h);
  }

  update(dt) {
    if (this.current?.update) this.current.update(dt);
  }

  render(renderer) {
    if (this.current?.render) this.current.render(renderer);
  }
}
