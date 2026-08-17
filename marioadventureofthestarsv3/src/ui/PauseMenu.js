// ---------------------------------------------------------------------------
// Minimal pause overlay: Resume / Restart Level / Quit to Map. Reused by
// GameplayScene whenever any player presses their pause key.
// ---------------------------------------------------------------------------
let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .pause-overlay { position:absolute; inset:0; background:rgba(10,10,20,0.6); display:flex; align-items:center; justify-content:center; z-index:50; font-family:'Trebuchet MS','Segoe UI',sans-serif; }
    .pause-card { background:linear-gradient(160deg,#2b3a67,#1a2340); border:4px solid #ffe066; border-radius:20px; padding:28px 36px; text-align:center; box-shadow:0 12px 30px rgba(0,0,0,0.5); min-width:280px; }
    .pause-title { color:#ffe066; font-size:28px; font-weight:900; letter-spacing:2px; margin-bottom:18px; text-shadow:0 3px 0 rgba(0,0,0,0.4); }
    .pause-btn { display:block; width:100%; margin:8px 0; padding:12px 18px; font-size:17px; font-weight:800; color:#2b1f33; background:#ffe066; border:none; border-radius:12px; cursor:pointer; transition:transform 0.1s, background 0.15s; }
    .pause-btn:hover, .pause-btn.sel { background:#fff2a8; transform:scale(1.04); }
    .pause-btn.secondary { background:#7ec8e3; }
    .pause-btn.secondary:hover, .pause-btn.secondary.sel { background:#a8dcf0; }
  `;
  document.head.appendChild(style);
}

export class PauseMenu {
  constructor(container, { onResume, onRestart, onQuit }) {
    injectStyle();
    this.el = document.createElement('div');
    this.el.className = 'pause-overlay';
    this.el.style.display = 'none';
    this.el.innerHTML = `
      <div class="pause-card">
        <div class="pause-title">PAUSED</div>
        <button class="pause-btn" data-a="resume">Resume</button>
        <button class="pause-btn secondary" data-a="restart">Restart Level</button>
        <button class="pause-btn secondary" data-a="quit">Quit to Map</button>
      </div>`;
    container.appendChild(this.el);
    this.el.querySelector('[data-a="resume"]').onclick = () => onResume();
    this.el.querySelector('[data-a="restart"]').onclick = () => onRestart();
    this.el.querySelector('[data-a="quit"]').onclick = () => onQuit();
    this.visible = false;
  }

  show() { this.visible = true; this.el.style.display = 'flex'; }
  hide() { this.visible = false; this.el.style.display = 'none'; }
  toggle() { this.visible ? this.hide() : this.show(); }
  dispose() { this.el.remove(); }
}
