import { KEYBINDS } from '../core/Config.js';

// ---------------------------------------------------------------------------
// A single shared "how do I play this" overlay, opened from the title screen
// and from the pause menu. The key names are read straight out of KEYBINDS
// so the panel can never drift out of sync with the actual bindings.
// ---------------------------------------------------------------------------

/** Turns KeyboardEvent.code values into something a person can read. */
function pretty(code) {
  const named = {
    Space: 'Space', Enter: 'Enter', NumpadEnter: 'Num Enter', Escape: 'Esc',
    ShiftLeft: 'Shift', ShiftRight: 'R-Shift', ControlRight: 'R-Ctrl',
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  };
  if (named[code]) return named[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

const keysFor = (pid, action) => (KEYBINDS[pid]?.[action] || []).map(pretty).join(' / ');

const ACTIONS = [
  { action: 'left', label: 'Move left' },
  { action: 'right', label: 'Move right' },
  { action: 'forward', label: 'Move away from camera' },
  { action: 'back', label: 'Move toward camera / crouch' },
  { action: 'jump', label: 'Jump — tap again in mid-air to Double Jump' },
  { action: 'action', label: 'Punch on the ground · Ground Pound in mid-air' },
  { action: 'pause', label: 'Pause' },
];

const MOVES = [
  ['Double Jump', 'Press jump a second time while airborne to clear wide gaps.'],
  ['Ground Pound', 'Press action in mid-air: you spin, hang, then slam straight down. Breaks crumbling blocks and stuns everything nearby.'],
  ['Stomp', 'Land on an enemy from above. Spinies and spike-tops will hurt you instead — punch those.'],
  ['Fire Flower', 'Your punch becomes a thrown fireball. One hit and you lose it.'],
  ['Mega Mushroom', 'Grow huge, smash brick blocks by jumping into them, and shrug off one hit that would have cost a life.'],
];

let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .ctrl-panel { pointer-events:auto; position:absolute; inset:0; background:rgba(10,10,20,0.72); display:flex; align-items:center; justify-content:center; z-index:40; font-family:'Trebuchet MS','Segoe UI',sans-serif; }
    .ctrl-card { background:linear-gradient(160deg,#2b3a67,#1a2340); border:4px solid #ffe066; border-radius:20px; padding:22px 28px; width:min(92vw,720px); max-height:88vh; overflow-y:auto; }
    .ctrl-title { color:#ffe066; font-size:22px; font-weight:900; letter-spacing:1px; text-align:center; margin-bottom:14px; }
    .ctrl-cols { display:grid; grid-template-columns:1fr; gap:18px; }
    @media (min-width:620px) { .ctrl-cols { grid-template-columns:1fr 1fr; } }
    .ctrl-sub { color:#8fd6ff; font-size:13px; font-weight:800; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
    .ctrl-row { display:flex; align-items:baseline; gap:10px; margin:7px 0; color:#fff; font-size:14px; }
    .ctrl-key { flex:0 0 auto; min-width:74px; font-weight:800; color:#2b1f33; background:#ffe066; border-radius:7px; padding:3px 8px; text-align:center; font-size:13px; box-shadow:0 2px 0 #b08d1a; }
    .ctrl-what { color:rgba(255,255,255,0.9); }
    .ctrl-moves { margin-top:20px; border-top:2px solid rgba(255,255,255,0.15); padding-top:14px; }
    .ctrl-move { margin:9px 0; color:rgba(255,255,255,0.88); font-size:14px; line-height:1.45; }
    .ctrl-move b { color:#ffe066; }
    .ctrl-close { display:block; margin:18px auto 0; padding:10px 24px; font-weight:800; border-radius:10px; border:none; background:#ffe066; color:#2b1f33; cursor:pointer; font-size:15px; }
  `;
  document.head.appendChild(style);
}

/** Opens the controls overlay. Returns the element so callers can remove it. */
export function showControlsPanel(container) {
  injectStyle();
  const panel = document.createElement('div');
  panel.className = 'ctrl-panel';
  const rows = (pid) => ACTIONS
    .map((a) => `<div class="ctrl-row"><span class="ctrl-key">${keysFor(pid, a.action)}</span><span class="ctrl-what">${a.label}</span></div>`)
    .join('');
  panel.innerHTML = `
    <div class="ctrl-card">
      <div class="ctrl-title">CONTROLS</div>
      <div class="ctrl-cols">
        <div><div class="ctrl-sub">Player 1</div>${rows('p1')}</div>
        <div><div class="ctrl-sub">Player 2</div>${rows('p2')}</div>
      </div>
      <div class="ctrl-moves">
        <div class="ctrl-sub">Moves &amp; Powerups</div>
        ${MOVES.map(([n, d]) => `<div class="ctrl-move"><b>${n}</b> — ${d}</div>`).join('')}
      </div>
      <button class="ctrl-close" data-a="close">Close</button>
    </div>`;
  container.appendChild(panel);
  const close = () => panel.remove();
  panel.querySelector('[data-a="close"]').onclick = close;
  panel.onclick = (e) => { if (e.target === panel) close(); };
  return panel;
}
