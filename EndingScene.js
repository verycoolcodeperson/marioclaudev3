import * as THREE from 'three';
import { Input } from '../core/Input.js';
import { Music, SFX } from '../core/Audio.js';
import { createCloud, createTree, createFlower } from '../entities/Props.js';
import { setupSceneLighting } from '../utils/lighting.js';
import { ParticleSystem } from '../entities/Particles.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { ENDING_DIALOGUE } from '../story/dialogue.js';

const APP = document.getElementById('app');
const CONFETTI_COLORS = [0xffe066, 0xe6302c, 0x3fae4a, 0x3a6bd6, 0xffffff];

/** Victory scene shown once after 8-4 (Bowser) is defeated. */
export class EndingScene {
  async init() {
    this.threeScene = new THREE.Scene();
    this.threeScene.background = new THREE.Color(0x7ec0ee);
    this.threeScene.fog = new THREE.Fog(0xbfe6ff, 25, 80);
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 5, 13);
    this.camera.lookAt(0, 3, 0);

    setupSceneLighting(this.threeScene, 0x7ec0ee);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 24), new THREE.MeshLambertMaterial({ color: 0x4caf50 }));
    ground.rotation.x = -Math.PI / 2;
    this.threeScene.add(ground);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.threeScene.add(createTree(Math.cos(a) * 12, 0, Math.sin(a) * 12, { scale: 1 }));
      this.threeScene.add(createFlower(Math.cos(a) * 7, 0, Math.sin(a) * 7, { color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }));
    }
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      const c = createCloud((Math.random() - 0.5) * 40, 11 + Math.random() * 4, -14 - Math.random() * 14, { scale: 1.5 });
      this.threeScene.add(c);
      this.clouds.push({ mesh: c, speed: 0.3 + Math.random() * 0.3 });
    }

    this.particles = new ParticleSystem(this.threeScene);
    this.confettiTimer = 0;

    this.dialogueBox = new DialogueBox(APP);
    this._buildDOM();

    Music.playTrack('victory');
    SFX.play('complete');
    setTimeout(() => this.dialogueBox.play(ENDING_DIALOGUE, () => this._showReturn()), 500);
  }

  _buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = 'position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding-top:6vh; pointer-events:none; font-family:"Trebuchet MS",sans-serif;';
    this.overlay.innerHTML = `
      <h1 style="font-size:clamp(30px,6vw,58px); color:#ffe066; -webkit-text-stroke:3px #7a1f1f; text-shadow:0 6px 0 #c9432a; margin:0;">THE KINGDOM IS SAVED!</h1>
      <div id="ending-return" style="margin-top:20px; display:none; pointer-events:auto;">
        <button style="padding:14px 26px; font-size:18px; font-weight:800; border-radius:12px; border:3px solid #7a1f1f; background:#ffe066; cursor:pointer; box-shadow:0 5px 0 #7a1f1f;">Return to Title</button>
      </div>`;
    APP.appendChild(this.overlay);
    this.overlay.querySelector('#ending-return button').onclick = () => this.sceneManager.goto('title', {});
  }

  _showReturn() {
    const el = this.overlay.querySelector('#ending-return');
    el.style.display = 'block';
  }

  onResize(w, h) {
    if (!this.camera) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    if (this.dialogueBox.isActive()) {
      const input = Input.getPlayerState('p1');
      const input2 = Input.getPlayerState('p2');
      if (input?.actionPressed || input2?.actionPressed) this.dialogueBox.advance();
    }
    this.confettiTimer -= dt;
    if (this.confettiTimer <= 0) {
      this.confettiTimer = 0.35;
      const x = (Math.random() - 0.5) * 10;
      this.particles.burst(x, 8, -2 + (Math.random() - 0.5) * 4, CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)], 6, 2.2);
    }
    this.particles.update(dt);
    for (const c of this.clouds) {
      c.mesh.position.x += c.speed * dt;
      if (c.mesh.position.x > 35) c.mesh.position.x = -35;
    }
  }

  render(renderer) {
    renderer.render(this.threeScene, this.camera);
  }

  dispose() {
    this.overlay?.remove();
    this.dialogueBox?.dispose();
  }
}
