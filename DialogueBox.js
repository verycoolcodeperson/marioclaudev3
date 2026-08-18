import { getCharacterFace } from '../entities/Face.js';

// ---------------------------------------------------------------------------
// Short dialogue-box overlay used for NPC chats, tutorial hints, and
// between-world story beats. Cycles the speaker's portrait between two
// "talking" mouth-flap frames while a line is showing (mouth stays mostly
// hidden under the mustache/beak, just a small sliver of motion) and shows
// an idle/happy portrait when finished. Advances one line per action press.
// ---------------------------------------------------------------------------
let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .dlg-overlay { position:absolute; left:0; right:0; bottom:0; display:flex; justify-content:center; padding:0 0 26px; z-index:60; font-family:'Trebuchet MS','Segoe UI',sans-serif; pointer-events:none; }
    .dlg-box { pointer-events:auto; display:flex; align-items:center; gap:16px; background:linear-gradient(160deg,#fffef2,#fff2c8); border:4px solid #3a2b1a; border-radius:18px; padding:14px 26px; max-width:640px; box-shadow:0 10px 24px rgba(0,0,0,0.4); opacity:0; transform:translateY(20px); transition:opacity 0.25s, transform 0.25s; }
    .dlg-box.show { opacity:1; transform:translateY(0); }
    .dlg-portrait { width:64px; height:64px; image-rendering:pixelated; border-radius:12px; border:3px solid #3a2b1a; background:#ffc89b; flex:0 0 auto; }
    .dlg-text-wrap { display:flex; flex-direction:column; gap:4px; }
    .dlg-name { font-weight:900; font-size:15px; color:#c9432a; letter-spacing:0.5px; }
    .dlg-text { font-size:17px; color:#2b1f13; font-weight:600; line-height:1.3; }
    .dlg-hint { font-size:11px; color:#8a7452; align-self:flex-end; }
  `;
  document.head.appendChild(style);
}

export class DialogueBox {
  constructor(container) {
    injectStyle();
    this.overlay = document.createElement('div');
    this.overlay.className = 'dlg-overlay';
    this.overlay.innerHTML = `
      <div class="dlg-box">
        <img class="dlg-portrait" />
        <div class="dlg-text-wrap">
          <div class="dlg-name"></div>
          <div class="dlg-text"></div>
          <div class="dlg-hint">Press ACTION to continue</div>
        </div>
      </div>`;
    container.appendChild(this.overlay);
    this.box = this.overlay.querySelector('.dlg-box');
    this.portrait = this.overlay.querySelector('.dlg-portrait');
    this.nameEl = this.overlay.querySelector('.dlg-name');
    this.textEl = this.overlay.querySelector('.dlg-text');

    this.queue = [];
    this.active = false;
    this.current = null;
    this.onComplete = null;
    this.talkFrame = 0;
    this._talkInterval = setInterval(() => {
      if (!this.active) return;
      this.talkFrame = 1 - this.talkFrame;
      this._paintPortrait(this.talkFrame === 0 ? 'talkA' : 'talkB');
    }, 150);
  }

  _paintPortrait(expression) {
    if (!this.current) return;
    const tex = getCharacterFace(this.current.character, expression);
    this.portrait.src = tex.image.toDataURL();
  }

  /** lines: [{ character:'peach', name:'Peach', text:'...' }, ...] */
  play(lines, onComplete = null) {
    this.queue = [...lines];
    this.onComplete = onComplete;
    this.active = true;
    this._next();
  }

  _next() {
    if (!this.queue.length) {
      this.active = false;
      this.box.classList.remove('show');
      const cb = this.onComplete;
      this.onComplete = null;
      if (cb) cb();
      return;
    }
    this.current = this.queue.shift();
    this.nameEl.textContent = this.current.name || this.current.character.toUpperCase();
    this.textEl.textContent = this.current.text;
    this._paintPortrait('talkA');
    this.box.classList.add('show');
  }

  /** Call when the active player's action key is pressed. Returns true if it consumed the press. */
  advance() {
    if (!this.active) return false;
    this._next();
    return true;
  }

  isActive() {
    return this.active;
  }

  dispose() {
    clearInterval(this._talkInterval);
    this.overlay.remove();
  }
}
