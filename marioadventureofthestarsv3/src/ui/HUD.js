// ---------------------------------------------------------------------------
// DOM-based HUD overlay (crisper and cheaper than in-canvas text/sprites).
// Shows lives/health top-left, coins top-right, stars bottom-center, and
// automatically splits into two panels for local multiplayer. Icons are
// plain emoji - zero asset loading, always crisp, colorful by default.
// ---------------------------------------------------------------------------

let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .hud-root { position:absolute; inset:0; pointer-events:none; font-family:'Trebuchet MS','Segoe UI',sans-serif; z-index:20; }
    .hud-panel { position:absolute; display:flex; align-items:center; gap:8px; padding:8px 14px; background:rgba(20,20,30,0.45); border-radius:14px; border:2px solid rgba(255,255,255,0.25); backdrop-filter: blur(2px); }
    .hud-topleft { top:14px; left:14px; flex-direction:column; align-items:flex-start; gap:4px; }
    .hud-topleft.p2 { top:112px; }
    .hud-topright { top:14px; right:14px; }
    .hud-topright.p2 { top:66px; }
    .hud-row { display:flex; align-items:center; gap:6px; }
    .hud-name { font-size:13px; font-weight:700; color:#fff; text-shadow:0 2px 3px rgba(0,0,0,0.6); letter-spacing:0.5px; }
    .hud-icon { font-size:20px; filter:drop-shadow(0 2px 2px rgba(0,0,0,0.5)); }
    .hud-icon.dim { opacity:0.3; filter:none; }
    .hud-count { font-size:20px; font-weight:800; color:#fff; text-shadow:0 2px 3px rgba(0,0,0,0.7); min-width:1.4em; }
    .hud-stars { position:absolute; bottom:16px; left:50%; transform:translateX(-50%); display:flex; gap:10px; padding:8px 18px; background:rgba(20,20,30,0.45); border-radius:14px; border:2px solid rgba(255,255,255,0.25); }
    .hud-levelname { position:absolute; top:14px; left:50%; transform:translateX(-50%); color:#fff; font-weight:800; font-size:18px; text-shadow:0 2px 4px rgba(0,0,0,0.7); background:rgba(20,20,30,0.35); padding:4px 16px; border-radius:10px; opacity:0; transition:opacity 0.5s; }
    .hud-levelname.show { opacity:1; }
    .hud-prompt { position:absolute; bottom:90px; left:50%; transform:translateX(-50%); color:#fff; font-weight:700; font-size:16px; background:rgba(20,20,30,0.55); padding:6px 16px; border-radius:10px; opacity:0; transition:opacity 0.2s; }
    .hud-prompt.show { opacity:1; }
    .hud-fade { position:absolute; inset:0; background:#000; opacity:0; transition:opacity 0.4s; pointer-events:none; }
    .hud-fade.show { opacity:1; }
  `;
  document.head.appendChild(style);
}

export class HUD {
  constructor(container) {
    injectStyle();
    this.root = document.createElement('div');
    this.root.className = 'hud-root';
    container.appendChild(this.root);

    this.levelNameEl = document.createElement('div');
    this.levelNameEl.className = 'hud-levelname';
    this.root.appendChild(this.levelNameEl);

    this.starsEl = document.createElement('div');
    this.starsEl.className = 'hud-stars';
    this.root.appendChild(this.starsEl);

    this.promptEl = document.createElement('div');
    this.promptEl.className = 'hud-prompt';
    this.root.appendChild(this.promptEl);

    this.fadeEl = document.createElement('div');
    this.fadeEl.className = 'hud-fade';
    this.root.appendChild(this.fadeEl);

    this.playerPanels = {};
    this.multiplayer = false;
  }

  setMultiplayer(isMulti) {
    this.multiplayer = isMulti;
  }

  showLevelName(name, duration = 2.4) {
    this.levelNameEl.textContent = name;
    this.levelNameEl.classList.add('show');
    clearTimeout(this._levelNameTimer);
    this._levelNameTimer = setTimeout(() => this.levelNameEl.classList.remove('show'), duration * 1000);
  }

  showPrompt(text) {
    this.promptEl.textContent = text;
    this.promptEl.classList.add('show');
  }
  hidePrompt() {
    this.promptEl.classList.remove('show');
  }

  fadeToBlack(show) {
    this.fadeEl.classList.toggle('show', show);
  }

  _ensurePanel(playerId) {
    if (this.playerPanels[playerId]) return this.playerPanels[playerId];
    const isP2 = playerId === 'p2';
    const topLeft = document.createElement('div');
    topLeft.className = `hud-panel hud-topleft${isP2 ? ' p2' : ''}`;
    const nameEl = document.createElement('div');
    nameEl.className = 'hud-name';
    nameEl.textContent = isP2 ? 'LUIGI' : 'MARIO';
    const heartsRow = document.createElement('div');
    heartsRow.className = 'hud-row';
    const livesRow = document.createElement('div');
    livesRow.className = 'hud-row';
    topLeft.appendChild(nameEl);
    topLeft.appendChild(heartsRow);
    topLeft.appendChild(livesRow);
    this.root.appendChild(topLeft);

    const topRight = document.createElement('div');
    topRight.className = `hud-panel hud-topright${isP2 ? ' p2' : ''}`;
    const coinIcon = document.createElement('span');
    coinIcon.className = 'hud-icon';
    coinIcon.textContent = '🪙';
    const coinCount = document.createElement('span');
    coinCount.className = 'hud-count';
    topRight.appendChild(coinIcon);
    topRight.appendChild(coinCount);
    this.root.appendChild(topRight);

    const panel = { topLeft, topRight, heartsRow, livesRow, coinCount };
    this.playerPanels[playerId] = panel;
    return panel;
  }

  removePanel(playerId) {
    const p = this.playerPanels[playerId];
    if (!p) return;
    p.topLeft.remove();
    p.topRight.remove();
    delete this.playerPanels[playerId];
  }

  update(players, level) {
    for (const player of players) {
      if (!player) continue;
      const panel = this._ensurePanel(player.playerId);
      // hearts
      if (panel.heartsRow.childElementCount !== player.maxHealth) {
        panel.heartsRow.innerHTML = '';
        for (let i = 0; i < player.maxHealth; i++) {
          const h = document.createElement('span');
          h.className = 'hud-icon';
          panel.heartsRow.appendChild(h);
        }
      }
      Array.from(panel.heartsRow.children).forEach((el, i) => {
        el.textContent = i < player.health ? '❤️' : '🖤';
      });
      // lives
      if (!panel.livesRow.firstChild) {
        const icon = document.createElement('span');
        icon.className = 'hud-icon';
        icon.textContent = '🍄';
        const count = document.createElement('span');
        count.className = 'hud-count';
        count.dataset.lives = '1';
        panel.livesRow.appendChild(icon);
        panel.livesRow.appendChild(count);
      }
      panel.livesRow.lastChild.textContent = `x${Math.max(0, player.lives)}`;
      panel.coinCount.textContent = player.coins;
    }

    if (level) {
      const total = level.totalStars || 3;
      const collected = new Set();
      for (const player of players) {
        if (!player) continue;
        for (const id of player.starsCollected) collected.add(id);
      }
      if (this.starsEl.childElementCount !== total) {
        this.starsEl.innerHTML = '';
        for (let i = 0; i < total; i++) {
          const s = document.createElement('span');
          s.className = 'hud-icon';
          this.starsEl.appendChild(s);
        }
      }
      Array.from(this.starsEl.children).forEach((el, i) => {
        el.textContent = i < collected.size ? '⭐' : '☆';
        el.classList.toggle('dim', i >= collected.size);
      });
    }
  }

  dispose() {
    this.root.remove();
  }
}
