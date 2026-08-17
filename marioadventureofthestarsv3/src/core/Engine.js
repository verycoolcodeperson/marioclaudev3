import * as THREE from 'three';
import { Input } from './Input.js';

// ---------------------------------------------------------------------------
// Thin wrapper around the WebGL renderer + main loop. Scenes are swapped via
// SceneManager; this file only owns the canvas, renderer, clock and resize.
// ---------------------------------------------------------------------------
export class Engine {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.sceneManager = null;
    this._resizeHandler = () => this._onResize();
    window.addEventListener('resize', this._resizeHandler);
    this._onResize();

    this._running = false;
    this._maxDt = 1 / 20; // clamp huge stalls (tab switch, etc.)
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    if (this.sceneManager) this.sceneManager.onResize(w, h);
  }

  setSceneManager(sm) {
    this.sceneManager = sm;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.renderer.setAnimationLoop(() => this._tick());
  }

  _tick() {
    const dt = Math.min(this.clock.getDelta(), this._maxDt);
    if (this.sceneManager) {
      this.sceneManager.update(dt);
      this.sceneManager.render(this.renderer);
    }
    // Clear "just pressed" edges only after every scene has had a chance to
    // read them this frame.
    Input.endFrame();
  }
}
