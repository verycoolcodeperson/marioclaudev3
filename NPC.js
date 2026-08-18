import * as THREE from 'three';
import { createCharacterModel, animateCharacter } from './CharacterModel.js';
import { distance2D } from '../core/Collision.js';

// ---------------------------------------------------------------------------
// A friendly non-player character that idles in place and can trigger a
// dialogue script when a player walks close and presses the action key.
// Reuses CharacterModel so NPCs look consistent with the playable cast.
// ---------------------------------------------------------------------------
export class NPC {
  constructor({ character = 'toad', x = 0, y = 0, z = 0, dialogue = null, promptText = 'Talk', autoTrigger = false, facing = 0 }) {
    this.character = character;
    this.model = createCharacterModel(character);
    this.group = this.model.group;
    this.position = new THREE.Vector3(x, y, z);
    this.group.position.copy(this.position);
    this.group.rotation.y = facing;
    this.dialogue = dialogue;
    this.promptText = promptText;
    this.autoTrigger = autoTrigger;
    this.triggered = false;
    this.inRange = false;
    this.walkTime = Math.random() * 10;
    this.radius = 1.8;
  }

  update(dt, players) {
    this.walkTime += dt;
    animateCharacter(this.model, dt, { speedRatio: 0, grounded: true, walkTime: this.walkTime, talking: false });
    this.group.position.y = this.position.y + Math.sin(this.walkTime * 1.4) * 0.02;

    this.inRange = false;
    for (const p of players) {
      if (!p || p.dead) continue;
      if (distance2D(this.position.x, this.position.z, p.position.x, p.position.z) < this.radius) {
        this.inRange = true;
        const dx = p.position.x - this.position.x;
        const dz = p.position.z - this.position.z;
        this.group.rotation.y = Math.atan2(dx, dz);
      }
    }
  }
}
