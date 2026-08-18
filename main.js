import { Engine } from './core/Engine.js';
import { SceneManager } from './core/SceneManager.js';
import { TitleScene } from './scenes/TitleScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { GameplayScene } from './scenes/GameplayScene.js';
import { EndingScene } from './scenes/EndingScene.js';
import { getLevelById, getTutorialLevel } from './levels/registry.js';

const container = document.getElementById('app');
const engine = new Engine(container);
const sceneManager = new SceneManager();
engine.setSceneManager(sceneManager);

sceneManager.register('title', () => new TitleScene());
sceneManager.register('worldmap', () => new WorldMapScene());
sceneManager.register('gameplay', () => new GameplayScene());
sceneManager.register('ending', () => new EndingScene());

sceneManager.goto('title', {});
engine.start();

// Small debug hook (harmless in a client-side game) - lets you jump straight
// to a level from the browser console, e.g.:
//   __game.startLevel(__levels.getLevelById('1-4'), { returnTo: { mode: 'hub' } })
window.__game = sceneManager;
window.__levels = { getLevelById, getTutorialLevel };
