import * as THREE from 'three';
import { Music, SFX } from '../core/Audio.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { createCloud, createTree, createBush, createFlower } from '../entities/Props.js';
import { setupSceneLighting } from '../utils/lighting.js';

const APP = document.getElementById('app');

let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .title-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:'Trebuchet MS','Segoe UI',sans-serif; z-index:10; pointer-events:none; }
    .title-card { text-align:center; pointer-events:auto; }
    .title-h1 { font-size:clamp(38px,7vw,72px); font-weight:900; color:#ffe066; -webkit-text-stroke:3px #7a1f1f; text-stroke:3px #7a1f1f; text-shadow:0 6px 0 #c9432a, 0 12px 18px rgba(0,0,0,0.5); letter-spacing:3px; margin:0; animation:titleBob 3s ease-in-out infinite; }
    .title-h2 { font-size:clamp(14px,2.4vw,22px); font-weight:800; color:#fff; letter-spacing:6px; margin:2px 0 30px; text-shadow:0 3px 6px rgba(0,0,0,0.5); }
    @keyframes titleBob { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-8px);} }
    .title-menu { display:flex; flex-direction:column; gap:12px; width:260px; margin:0 auto; }
    .title-btn { padding:14px 20px; font-size:19px; font-weight:800; letter-spacing:1px; color:#2b1f33; background:linear-gradient(180deg,#ffe066,#ffc93c); border:3px solid #7a1f1f; border-radius:14px; cursor:pointer; box-shadow:0 5px 0 #7a1f1f; transition:transform 0.08s; }
    .title-btn:hover { transform:translateY(-2px); }
    .title-btn:active { transform:translateY(3px); box-shadow:0 2px 0 #7a1f1f; }
    .title-btn.secondary { background:linear-gradient(180deg,#7ec8e3,#4fb0d8); }
    .title-footer { position:absolute; bottom:14px; left:0; right:0; text-align:center; color:rgba(255,255,255,0.75); font-size:12px; pointer-events:none; }
    .title-panel { pointer-events:auto; position:absolute; inset:0; background:rgba(10,10,20,0.65); display:flex; align-items:center; justify-content:center; z-index:30; }
    .title-panel-card { background:linear-gradient(160deg,#2b3a67,#1a2340); border:4px solid #ffe066; border-radius:20px; padding:26px 34px; min-width:320px; text-align:center; }
    .title-panel-title { color:#ffe066; font-size:22px; font-weight:900; margin-bottom:16px; letter-spacing:1px; }
    .title-row { display:flex; align-items:center; justify-content:space-between; gap:12px; color:#fff; font-weight:700; margin:10px 0; }
    .title-row input[type=range] { width:150px; }
    .title-panel-btn { margin-top:14px; padding:10px 18px; font-weight:800; border-radius:10px; border:none; background:#ffe066; cursor:pointer; }
    .title-panel-btn.danger { background:#e6534a; color:#fff; }
  `;
  document.head.appendChild(style);
}

export class TitleScene {
  async init() {
    injectStyle();
    this.threeScene = new THREE.Scene();
    this.threeScene.background = new THREE.Color(0x7ec0ee);
    this.threeScene.fog = new THREE.Fog(0xbfe6ff, 25, 75);
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

    setupSceneLighting(this.threeScene, 0x7ec0ee);

    const groundGeo = new THREE.CircleGeometry(30, 24);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.threeScene.add(ground);

    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 14;
      const builder = i % 3 === 0 ? createBush : createTree;
      this.threeScene.add(builder(Math.cos(a) * r, 0, Math.sin(a) * r, { scale: 0.9 + Math.random() * 0.5 }));
    }
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 16;
      this.threeScene.add(createFlower(Math.cos(a) * r, 0, Math.sin(a) * r, { color: [0xff6a9c, 0xffe066, 0xffffff][i % 3] }));
    }

    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      const c = createCloud((Math.random() - 0.5) * 50, 10 + Math.random() * 6, -15 - Math.random() * 20, { scale: 1.4 + Math.random() });
      this.threeScene.add(c);
      this.clouds.push({ mesh: c, speed: 0.3 + Math.random() * 0.4 });
    }

    const starGeo = (() => {
      const shape = new THREE.Shape();
      const outerR = 1.1, innerR = 0.46;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(ang) * r, py = Math.sin(ang) * r;
        if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
      }
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1 });
    })();
    this.starMesh = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x998200, emissiveIntensity: 0.4 }));
    this.starMesh.position.set(0, 4.5, -3);
    this.starMesh.castShadow = true;
    this.threeScene.add(this.starMesh);

    this.camAngle = 0;
    this.camera.position.set(0, 5, 13);
    this.camera.lookAt(0, 3, -3);

    this._buildDOM();
    Music.playTrack('title');
  }

  _buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'title-overlay';
    this.overlay.innerHTML = `
      <div class="title-card">
        <h1 class="title-h1">SUPER MARIO</h1>
        <div class="title-h2">ADVENTURE OF THE STARS</div>
        <div class="title-menu">
          <button class="title-btn" data-a="play">PLAY</button>
          <button class="title-btn secondary" data-a="multiplayer">MULTIPLAYER</button>
          <button class="title-btn secondary" data-a="options">OPTIONS</button>
          <button class="title-btn secondary" data-a="exit">EXIT</button>
        </div>
      </div>
      <div class="title-footer">WASD/Arrows to move &middot; Space/Enter to jump &middot; Shift/Ctrl to act</div>
    `;
    APP.appendChild(this.overlay);
    this.overlay.querySelector('[data-a="play"]').onclick = () => this._startGame(false);
    this.overlay.querySelector('[data-a="multiplayer"]').onclick = () => this._startGame(true);
    this.overlay.querySelector('[data-a="options"]').onclick = () => this._showOptions();
    this.overlay.querySelector('[data-a="exit"]').onclick = () => this._showExit();
  }

  _startGame(multiplayer) {
    SFX.unlock();
    SFX.play('select');
    this.sceneManager.goto('worldmap', { mode: 'hub', multiplayerIntent: multiplayer });
  }

  _showOptions() {
    SFX.unlock();
    SFX.play('select');
    const panel = document.createElement('div');
    panel.className = 'title-panel';
    panel.innerHTML = `
      <div class="title-panel-card">
        <div class="title-panel-title">OPTIONS</div>
        <div class="title-row"><span>SFX Volume</span><input type="range" min="0" max="1" step="0.05" value="${SFX.masterVolume}" data-a="sfx"/></div>
        <div class="title-row"><span>Music Volume</span><input type="range" min="0" max="0.15" step="0.01" value="${Music.masterVolume}" data-a="music"/></div>
        <button class="title-panel-btn danger" data-a="reset">Reset Save Data</button>
        <button class="title-panel-btn" data-a="close">Close</button>
      </div>`;
    APP.appendChild(panel);
    panel.querySelector('[data-a="sfx"]').oninput = (e) => { SFX.masterVolume = parseFloat(e.target.value); };
    panel.querySelector('[data-a="music"]').oninput = (e) => { Music.masterVolume = parseFloat(e.target.value); };
    panel.querySelector('[data-a="reset"]').onclick = () => {
      if (window.confirm('Reset ALL save progress? This cannot be undone.')) {
        SaveSystem.resetAll();
        SFX.play('select');
      }
    };
    panel.querySelector('[data-a="close"]').onclick = () => panel.remove();
  }

  _showExit() {
    SFX.unlock();
    const panel = document.createElement('div');
    panel.className = 'title-panel';
    panel.innerHTML = `
      <div class="title-panel-card">
        <div class="title-panel-title">THANKS FOR PLAYING!</div>
        <p style="color:#fff;">Feel free to close this tab any time.</p>
        <button class="title-panel-btn" data-a="close">Back to Title</button>
      </div>`;
    APP.appendChild(panel);
    panel.querySelector('[data-a="close"]').onclick = () => panel.remove();
  }

  onResize(w, h) {
    if (!this.camera) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    this.camAngle += dt * 0.05;
    this.camera.position.x = Math.sin(this.camAngle) * 13;
    this.camera.position.z = 13 * Math.cos(this.camAngle);
    this.camera.lookAt(0, 3, -3);
    if (this.starMesh) {
      this.starMesh.rotation.y += dt * 0.8;
      this.starMesh.position.y = 4.5 + Math.sin(performance.now() * 0.001) * 0.2;
    }
    for (const c of this.clouds) {
      c.mesh.position.x += c.speed * dt;
      if (c.mesh.position.x > 45) c.mesh.position.x = -45;
    }
  }

  render(renderer) {
    renderer.render(this.threeScene, this.camera);
  }

  dispose() {
    this.overlay?.remove();
    APP.querySelectorAll('.title-panel').forEach((p) => p.remove());
  }
}
