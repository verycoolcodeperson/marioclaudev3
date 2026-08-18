import * as THREE from 'three';
import { CAMERA } from '../core/Config.js';
import { damp, clamp } from '../utils/math.js';

// ---------------------------------------------------------------------------
// Two camera behaviors live here:
//
// - 'side' (default): a fixed SIDE-ON camera for actual levels, Super
//   Mario 3D World style. It never rotates - only translates, panning
//   along X to track the player (the level's traversal axis) and
//   drifting very slowly in Y/Z so it reads as "planted" rather than a
//   chase cam swinging around behind the player.
//
// - 'overworld': an elevated angled-behind view for the free-roam hub/
//   world-map diorama, where the player can walk in any direction (a
//   locked side view doesn't work for that kind of open space). Fixed
//   compass heading, just translates to follow.
// ---------------------------------------------------------------------------
export class CameraRig {
  constructor(camera, mode = 'side') {
    this.camera = camera;
    this.mode = mode;
    this.laneZ = 0;
    // How far to the side the camera sits. Levels widen this when their
    // geometry is wider than the default standoff, otherwise the camera
    // ends up buried inside the level's own front face (boss arenas are
    // 22 units deep, well past the default 13).
    this.sideOffset = CAMERA.sideOffset;
    this.overworldYaw = -Math.PI / 2 + 0.6; // 'overworld' mode: fixed compass heading (3/4 angled-behind)
    this.focusX = 0;
    this.focusY = 0;
    this.focusZ = 0;
    this.currentPos = new THREE.Vector3();
    this.currentLook = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.initialized = false;
  }

  /** 'side' mode only: call once after construction if a level isn't centered on z=0. */
  setLane(z) {
    this.laneZ = z;
  }

  /** Widens the standoff so the camera clears unusually deep level geometry. */
  setOffset(v) {
    this.sideOffset = Math.max(CAMERA.sideOffset, v);
  }

  /**
   * Standing further back only helps if the camera also rises: a wide arena
   * is a deep solid block, so a low camera just stares at its front face.
   * Extra standoff buys proportional extra height to see over that edge.
   */
  _height() {
    return CAMERA.height + Math.max(0, this.sideOffset - CAMERA.sideOffset) * CAMERA.heightPerOffset;
  }

  _cameraPos(focusX, focusY, focusZ, offset) {
    if (this.mode === 'overworld') {
      return new THREE.Vector3(
        focusX + Math.sin(this.overworldYaw) * offset,
        focusY + CAMERA.height,
        focusZ + Math.cos(this.overworldYaw) * offset
      );
    }
    return new THREE.Vector3(focusX, focusY + this._height(), focusZ + offset);
  }

  _lookPos(focusX, focusY, focusZ) {
    return new THREE.Vector3(focusX, focusY + CAMERA.lookHeight, focusZ);
  }

  snapTo(targetPos) {
    this.focusX = targetPos.x;
    this.focusY = targetPos.y;
    this.focusZ = this.mode === 'overworld' ? targetPos.z : this.laneZ;
    const pos = this._cameraPos(this.focusX, this.focusY, this.focusZ, this.sideOffset);
    this.currentPos.copy(pos);
    this.currentLook.copy(this._lookPos(this.focusX, this.focusY, this.focusZ));
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLook);
    this.initialized = true;
  }

  /** targets: array of THREE.Vector3-like positions. collisionMeshes: array of THREE.Object3D for occlusion. */
  update(dt, targets, collisionMeshes = []) {
    if (!targets.length) return;
    const center = new THREE.Vector3();
    for (const t of targets) center.add(t);
    center.divideScalar(targets.length);

    let spreadX = 0;
    for (const t of targets) spreadX = Math.max(spreadX, Math.abs(t.x - center.x));
    const offset = clamp(this.sideOffset + spreadX * 1.1, this.sideOffset, this.sideOffset + CAMERA.multiplayerMaxOffset - CAMERA.sideOffset);

    if (!this.initialized) this.snapTo(center);

    if (this.mode === 'overworld') {
      // Free-roam: track both X and Z reasonably briskly (any direction of
      // travel matters here), height stays gently damped.
      this.focusX = damp(this.focusX, center.x, CAMERA.followLerp, dt);
      this.focusY = damp(this.focusY, center.y, CAMERA.heightLerp, dt);
      this.focusZ = damp(this.focusZ, center.z, CAMERA.followLerp, dt);
    } else {
      // Side-on: X pans briskly to keep the player in frame; Y/Z drift
      // slowly so the camera reads as "planted", not chasing every jump.
      //
      // The slow height drift is right for hops and small steps, but a long
      // fall outruns it and the player slides off the bottom of the screen
      // with no view of what they're falling towards. So the vertical lerp
      // stays lazy only while the player is inside a comfortable band, and
      // accelerates the further outside it they get.
      const dy = Math.abs(center.y - this.focusY);
      const urgency = clamp((dy - CAMERA.verticalDeadzone) / CAMERA.verticalCatchupRange, 0, 1);
      const heightLerp = CAMERA.heightLerp + (CAMERA.heightCatchupLerp - CAMERA.heightLerp) * urgency;
      this.focusX = damp(this.focusX, center.x, CAMERA.followLerp, dt);
      this.focusY = damp(this.focusY, center.y, heightLerp, dt);
      this.focusZ = damp(this.focusZ, this.laneZ + (center.z - this.laneZ) * 0.3, CAMERA.heightLerp, dt);
    }

    const desired = this._cameraPos(this.focusX, this.focusY, this.focusZ, offset);
    const look = this._lookPos(this.focusX, this.focusY, this.focusZ);

    if (collisionMeshes.length && this.mode === 'overworld') {
      const dir = new THREE.Vector3().subVectors(desired, look);
      const fullDist = dir.length();
      dir.normalize();
      this.raycaster.set(look, dir);
      this.raycaster.far = fullDist;
      const hits = this.raycaster.intersectObjects(collisionMeshes, false);
      if (hits.length) {
        const hitDist = Math.max(CAMERA.minDistance, hits[0].distance - CAMERA.collisionPadding);
        desired.copy(look).addScaledVector(dir, hitDist);
      }
    }

    this.currentPos.x = damp(this.currentPos.x, desired.x, CAMERA.followLerp, dt);
    this.currentPos.y = damp(this.currentPos.y, desired.y, CAMERA.followLerp, dt);
    this.currentPos.z = damp(this.currentPos.z, desired.z, CAMERA.followLerp, dt);
    this.currentLook.x = damp(this.currentLook.x, look.x, CAMERA.followLerp, dt);
    this.currentLook.y = damp(this.currentLook.y, look.y, CAMERA.followLerp, dt);
    this.currentLook.z = damp(this.currentLook.z, look.z, CAMERA.followLerp, dt);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLook);
  }

  /** Movement stays camera-relative. Side-on always faces -Z; overworld uses its fixed compass heading. */
  getYaw() {
    return this.mode === 'overworld' ? this.overworldYaw : 0;
  }
}
