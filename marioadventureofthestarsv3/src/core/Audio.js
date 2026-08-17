// ---------------------------------------------------------------------------
// Lightweight synthesized audio manager.
//
// No external sound files are bundled (keeps the project tiny and license
// free). Every SFX below is generated on the fly with the Web Audio API -
// a few oscillators + a gain envelope. This gives real audio feedback
// without any asset pipeline.
//
// TO ADD REAL AUDIO LATER: replace the body of `play()` cases with
// `new Audio('/sfx/whatever.mp3').play()`, and replace MusicManager's
// oscillator pad in `playTrack()` with an <audio> loop. Everything that
// calls SFX.play('jump') / Music.playTrack('world') elsewhere in the
// codebase does not need to change.
// ---------------------------------------------------------------------------

class SFXManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterVolume = 0.35;
  }

  _ensureCtx() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** Call from a user gesture (title screen click/keypress) to unlock audio. */
  unlock() {
    this._ensureCtx();
  }

  _tone(freq, duration, { type = 'square', gain = 0.2, slideTo = null, delay = 0 } = {}) {
    if (!this.enabled) return;
    const ctx = this._ensureCtx();
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t0 + duration);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain * this.masterVolume, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  play(name) {
    switch (name) {
      case 'jump': this._tone(420, 0.16, { type: 'square', slideTo: 720, gain: 0.18 }); break;
      case 'doubleJump': this._tone(500, 0.2, { type: 'square', slideTo: 900, gain: 0.2 }); break;
      case 'groundPound': this._tone(160, 0.18, { type: 'sawtooth', slideTo: 60, gain: 0.28 }); break;
      case 'coin': this._tone(988, 0.09, { type: 'square', gain: 0.16 }); this._tone(1319, 0.13, { type: 'square', gain: 0.16, delay: 0.06 }); break;
      case 'star': this._tone(660, 0.1, { gain: 0.2 }); this._tone(880, 0.1, { gain: 0.2, delay: 0.09 }); this._tone(1108, 0.22, { gain: 0.22, delay: 0.18 }); break;
      case 'stomp': this._tone(300, 0.1, { type: 'triangle', slideTo: 90, gain: 0.22 }); break;
      case 'hit': this._tone(220, 0.14, { type: 'sawtooth', slideTo: 80, gain: 0.24 }); break;
      case 'damage': this._tone(160, 0.28, { type: 'sawtooth', slideTo: 50, gain: 0.3 }); break;
      case 'checkpoint': this._tone(523, 0.1, { gain: 0.18 }); this._tone(659, 0.1, { gain: 0.18, delay: 0.08 }); this._tone(784, 0.16, { gain: 0.2, delay: 0.16 }); break;
      case 'complete': this._tone(523, 0.12, { gain: 0.22 }); this._tone(659, 0.12, { gain: 0.22, delay: 0.1 }); this._tone(784, 0.12, { gain: 0.22, delay: 0.2 }); this._tone(1046, 0.3, { gain: 0.24, delay: 0.3 }); break;
      case 'bossHit': this._tone(140, 0.2, { type: 'sawtooth', slideTo: 40, gain: 0.32 }); break;
      case 'bossDefeat': this._tone(220, 0.5, { type: 'sawtooth', slideTo: 30, gain: 0.35 }); break;
      case 'select': this._tone(740, 0.06, { gain: 0.14 }); break;
      case 'lockedBuzz': this._tone(140, 0.15, { type: 'sawtooth', gain: 0.18 }); break;
      default: break;
    }
  }
}

class MusicManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.nodes = [];
    this.currentTrack = null;
    this.masterVolume = 0.05;
  }

  _ensureCtx() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  stop() {
    for (const n of this.nodes) {
      try { n.gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4); n.osc.stop(this.ctx.currentTime + 0.45); } catch (e) { /* noop */ }
    }
    this.nodes = [];
    this.currentTrack = null;
  }

  /**
   * Plays a very soft ambient pad placeholder for a track name (e.g.
   * 'title', 'grassland', 'boss', 'castle'). Swap this out for real
   * looping music later without touching any call sites.
   */
  playTrack(name) {
    if (this.currentTrack === name || !this.enabled) return;
    this.stop();
    this.currentTrack = name;
    const ctx = this._ensureCtx();
    const freqSets = {
      title: [261.6, 329.6, 392.0],
      grassland: [261.6, 329.6, 392.0],
      desert: [233.1, 293.7, 349.2],
      snow: [277.2, 349.2, 415.3],
      forest: [246.9, 311.1, 369.9],
      ocean: [220.0, 277.2, 329.6],
      lava: [207.7, 246.9, 311.1],
      sky: [293.7, 369.9, 440.0],
      castle: [174.6, 220.0, 261.6],
      boss: [155.6, 185.0, 233.1],
      hub: [261.6, 329.6, 392.0],
      victory: [329.6, 415.3, 493.9],
    };
    const freqs = freqSets[name] || freqSets.title;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(this.masterVolume / (i + 1), ctx.currentTime + 1.2);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      this.nodes.push({ osc, gain: g });
    });
  }
}

export const SFX = new SFXManager();
export const Music = new MusicManager();
