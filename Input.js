import { KEYBINDS } from './Config.js';

// ---------------------------------------------------------------------------
// Keyboard input manager. Tracks raw key state and exposes a simple
// per-player action snapshot (left/right/forward/back/jump/action) each
// frame, including "just pressed" edges for jump/action so double-jump /
// single-press attacks feel crisp. Multiplayer keybinds live in Config.js.
// ---------------------------------------------------------------------------
class InputManager {
  constructor() {
    this.down = new Set();
    // Populated by the keydown event itself (not by frame-polling), so a
    // press-then-release that both happen within a single animation frame
    // still registers as a "just pressed" edge that frame - important for
    // short/automated inputs and for players who tap keys quickly.
    this.justPressed = new Set();
    window.addEventListener('keydown', (e) => {
      if (!this.down.has(e.code)) this.justPressed.add(e.code);
      this.down.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
  }

  /** Call once, at the very end of each rendered frame (see Engine.js). */
  endFrame() {
    this.justPressed.clear();
  }

  isDown(codes) {
    return codes.some((c) => this.down.has(c));
  }

  wasPressed(codes) {
    return codes.some((c) => this.justPressed.has(c));
  }

  /** Returns a snapshot of a player's action state for this frame. */
  getPlayerState(playerId) {
    const map = KEYBINDS[playerId];
    if (!map) return null;
    return {
      left: this.isDown(map.left),
      right: this.isDown(map.right),
      forward: this.isDown(map.forward),
      back: this.isDown(map.back),
      jump: this.isDown(map.jump),
      jumpPressed: this.wasPressed(map.jump),
      action: this.isDown(map.action),
      actionPressed: this.wasPressed(map.action),
      pausePressed: this.wasPressed(map.pause),
    };
  }

  anyKeyPressed() {
    return this.down.size > 0;
  }
}

export const Input = new InputManager();
