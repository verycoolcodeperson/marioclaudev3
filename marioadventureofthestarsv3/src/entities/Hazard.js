import * as THREE from 'three';
import { waveTexture, speckleTexture } from '../utils/textures.js';
import { createPlatform } from './Platform.js';
import { updateColliderPosition } from '../core/Collision.js';

// ---------------------------------------------------------------------------
// Environmental hazards: lava/water kill-zones, spike traps (damage-only,
// no solid collision so timing a jump over them matters), and crumbling
// platforms that shake and drop out once stood on. All three are simple,
// cheap, and reused across every world theme.
// ---------------------------------------------------------------------------

const lavaMat = new THREE.MeshStandardMaterial({ map: waveTexture(0xff5a1f, 0xffb347, 8), emissive: 0xff3300, emissiveIntensity: 0.5 });
const waterMat = new THREE.MeshStandardMaterial({ map: waveTexture(0x1a8fa8, 0x3fc1d6, 8), transparent: true, opacity: 0.85 });

export function createHazardZone(spec) {
  const { x, y, z, sx = 4, sz = 4, kind = 'lava', instaKill = true } = spec;
  const geo = new THREE.PlaneGeometry(sx, sz);
  const mesh = new THREE.Mesh(geo, kind === 'water' ? waterMat : lavaMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = false;

  const zone = {
    type: 'hazardZone', kind, mesh, instaKill,
    minX: x - sx / 2, maxX: x + sx / 2, minZ: z - sz / 2, maxZ: z + sz / 2, topY: y + 0.25,
    update(dt, t) {
      mesh.position.y = y + Math.sin(t * 1.5) * 0.04;
    },
    testPlayer(px, py, pz) {
      if (px < this.minX || px > this.maxX || pz < this.minZ || pz > this.maxZ) return false;
      return py <= this.topY;
    },
  };
  return zone;
}

const spikeGeo = new THREE.ConeGeometry(0.18, 0.4, 5);
const spikeMat = new THREE.MeshLambertMaterial({ color: 0x9a9aa5 });

export function createSpikeTrap(spec) {
  const { x, y, z, sx = 1.6, sz = 1.2 } = spec;
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const cols = Math.max(2, Math.round(sx / 0.4));
  const rows = Math.max(2, Math.round(sz / 0.4));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set((i - (cols - 1) / 2) * 0.38, 0.2, (j - (rows - 1) / 2) * 0.38);
      spike.castShadow = true;
      group.add(spike);
    }
  }
  return {
    type: 'hazardZone', kind: 'spikes', mesh: group, instaKill: false,
    minX: x - sx / 2, maxX: x + sx / 2, minZ: z - sz / 2, maxZ: z + sz / 2, topY: y + 0.55,
    baseY: y - 0.15,
    update() {},
    testPlayer(px, py, pz) {
      if (px < this.minX || px > this.maxX || pz < this.minZ || pz > this.maxZ) return false;
      return py <= this.topY && py >= this.baseY;
    },
  };
}

const pitFloorMat = new THREE.MeshLambertMaterial({ color: 0x3f3f47 });

/** A chasm with a bed of spikes at the bottom - a classic "pitfall of spikes" instead of a bottomless gap. */
export function createSpikePit(spec) {
  const { x, y, z, sx = 4, sz = 6 } = spec;
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.5, sz), pitFloorMat);
  floor.position.y = -0.25;
  floor.receiveShadow = true;
  group.add(floor);

  const cols = Math.max(3, Math.round(sx / 0.42));
  const rows = Math.max(3, Math.round(sz / 0.42));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set((i - (cols - 1) / 2) * 0.4, 0.2, (j - (rows - 1) / 2) * 0.4);
      spike.castShadow = true;
      group.add(spike);
    }
  }

  return {
    type: 'hazardZone', kind: 'spikepit', mesh: group, instaKill: true,
    minX: x - sx / 2, maxX: x + sx / 2, minZ: z - sz / 2, maxZ: z + sz / 2, topY: y + 0.5,
    update() {},
    testPlayer(px, py, pz) {
      if (px < this.minX || px > this.maxX || pz < this.minZ || pz > this.maxZ) return false;
      return py <= this.topY;
    },
  };
}

/** A platform that shakes then drops away shortly after a player lands on it, then respawns. */
export function createCrumblePlatform(spec) {
  const { delay = 0.9, respawnDelay = 3.5, ...platformSpec } = spec;
  const platform = createPlatform({ ...platformSpec, textureType: platformSpec.textureType || 'speckle', color: platformSpec.color || 0xc98a3a });
  const baseY = platform.mesh.position.y;
  let standTimer = 0;
  let state = 'idle'; // idle | shaking | gone | respawning
  let respawnTimer = 0;

  const originalUpdate = platform.update.bind(platform);
  platform.crumbleState = state;
  platform.notifyStanding = (dt) => {
    if (state === 'idle') {
      standTimer += dt;
      if (standTimer >= delay) {
        state = 'shaking';
        standTimer = 0;
      }
    }
  };
  platform.notifyNotStanding = () => {
    if (state === 'idle') standTimer = 0;
  };
  platform.update = (dt) => {
    originalUpdate(dt);
    if (state === 'shaking') {
      standTimer += dt;
      platform.mesh.position.x = platform.mesh.position.x + (Math.random() - 0.5) * 0.02;
      const wobble = 0.35 - standTimer * 0.7;
      if (wobble > 0) {
        platform.mesh.rotation.z = Math.sin(standTimer * 40) * wobble * 0.05;
      }
      if (standTimer >= 0.35) {
        state = 'gone';
        platform.mesh.visible = false;
        platform.collider.passthrough = true;
        platform.collider.noGround = true;
        respawnTimer = 0;
      }
    } else if (state === 'gone') {
      respawnTimer += dt;
      if (respawnTimer >= respawnDelay) {
        state = 'idle';
        standTimer = 0;
        platform.mesh.visible = true;
        platform.mesh.rotation.z = 0;
        platform.mesh.position.set(platformSpec.x, baseY, platformSpec.z);
        updateColliderPosition(platform.collider, platformSpec.x, baseY, platformSpec.z);
        platform.collider.passthrough = false;
        platform.collider.noGround = false;
      }
    }
    platform.crumbleState = state;
  };
  return platform;
}
