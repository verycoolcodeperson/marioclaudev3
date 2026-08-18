import * as THREE from 'three';
import { createCharacterModel, animateCharacter, setExpression } from './CharacterModel.js';
import { PHYSICS } from '../core/Config.js';
import { sampleGround, resolveWalls } from '../core/Collision.js';
import { SFX } from '../core/Audio.js';
import { lerpAngle, clamp, damp } from '../utils/math.js';

// ---------------------------------------------------------------------------
// Player controller: camera-relative movement, jump/double-jump, crouch,
// ground pound, a short punch/stomp attack, health + invulnerability, and
// a small squash/stretch + walk-cycle animation driven through
// CharacterModel. Physics is a simple cylinder-vs-AABB scheme (see
// core/Collision.js) - no physics engine needed.
// ---------------------------------------------------------------------------
export class Player {
  constructor({ character = 'mario', playerId = 'p1', x = 0, y = 1, z = 0 } = {}) {
    this.playerId = playerId;
    this.model = createCharacterModel(character);
    this.group = this.model.group;
    this.group.castShadow = true;

    this.radius = 0.34;
    this.height = 1.55;

    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3();
    this.yaw = Math.PI / 2;
    this.group.position.copy(this.position);

    this.grounded = false;
    this.groundCollider = null;
    this.jumpCount = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.crouching = false;
    this.groundPounding = false;
    this.groundPoundLanded = false;
    this.attackTimer = 0;
    this.attackHasHit = false;
    this.groundPoundSpinTimer = 0;
    this.hurtFlashTimer = 0;
    this.invulnTimer = 0;
    this.knockback = new THREE.Vector3();
    this.walkTime = 0;

    this.maxHealth = 3;
    this.health = 3;
    this.lives = 4;
    this.coins = 0;
    this.starsCollected = new Set();
    this.dead = false;
    this.controlEnabled = true;
    this.frozen = false; // for dialogue / cutscenes

    this.respawnPoint = new THREE.Vector3(x, y, z);
    this.onDeath = null; // callback(player)
    this.onDamage = null;
    this.onGroundPoundImpact = null; // callback(x,y,z)
    this.onAttackHit = null; // reserved for future melee vs world objects

    this.expressionOverrideTimer = 0;

    // Powerups. `power` is null | 'fire' | 'mega'.
    //   fire - the grounded punch throws a fireball instead of swinging
    //   mega - twice the size, smashes bricks, and absorbs one hit that
    //          would otherwise have cost a life
    this.power = null;
    this.baseScale = 1;
    this.megaScale = 1.85;
    this.onShootFireball = null; // callback(x, y, z, dirX, dirZ)
  }

  get isMega() { return this.power === 'mega'; }

  /** Collision radius/height grow with Mega so the bigger body still fits the world. */
  get bodyRadius() { return this.radius * (this.isMega ? this.megaScale : 1); }
  get bodyHeight() { return this.height * (this.isMega ? this.megaScale : 1); }

  applyPowerup(kind) {
    if (kind === 'mega') {
      this.power = 'mega';
      this.megaHitAbsorb = true;
    } else if (kind === 'fire') {
      this.power = 'fire';
    }
    SFX.play('powerup');
    this.expressionOverrideTimer = 1.0;
    setExpression(this.model, 'happy');
  }

  /** Drops back to normal size/state - used when a Mega player takes a hit. */
  losePower() {
    this.power = null;
    this.megaHitAbsorb = false;
  }

  setSpawn(x, y, z) {
    this.respawnPoint.set(x, y, z);
  }

  teleport(x, y, z) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.group.position.copy(this.position);
    this.jumpCount = 0;
    this.grounded = false;
  }

  respawnAtCheckpoint() {
    this.teleport(this.respawnPoint.x, this.respawnPoint.y, this.respawnPoint.z);
    this.health = this.maxHealth;
    this.invulnTimer = 1.2;
  }

  takeDamage(amount = 1, knockDir = null) {
    if (this.invulnTimer > 0 || this.dead) return;
    // Mega soaks the hit entirely and shrinks back to normal, so the powerup
    // is worth a life rather than just a heart.
    if (this.power === 'mega') {
      this.losePower();
      this.invulnTimer = 1.5;
      this.hurtFlashTimer = 0.5;
      SFX.play('damage');
      if (knockDir) {
        this.velocity.x = knockDir.x * 5;
        this.velocity.z = knockDir.z * 5;
        this.velocity.y = 5;
      }
      return;
    }
    // Fire is lost on any hit, classic-style, before hearts start draining.
    if (this.power === 'fire') {
      this.losePower();
      this.invulnTimer = 1.2;
      this.hurtFlashTimer = 0.5;
      SFX.play('damage');
      return;
    }
    this.health -= amount;
    this.invulnTimer = 1.5;
    this.hurtFlashTimer = 0.5;
    SFX.play('damage');
    this.expressionOverrideTimer = 0.6;
    setExpression(this.model, 'hurt');
    if (knockDir) {
      this.velocity.x = knockDir.x * 6;
      this.velocity.z = knockDir.z * 6;
      this.velocity.y = 6;
    }
    if (this.onDamage) this.onDamage(this);
    if (this.health <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.lives -= 1;
    if (this.onDeath) this.onDeath(this);
  }

  reviveAtCheckpoint() {
    this.dead = false;
    this.health = this.maxHealth;
    this.respawnAtCheckpoint();
  }

  collectCoin(n = 1) {
    this.coins += n;
    SFX.play('coin');
  }

  collectStar(id) {
    if (this.starsCollected.has(id)) return false;
    this.starsCollected.add(id);
    SFX.play('star');
    this.expressionOverrideTimer = 1.0;
    setExpression(this.model, 'happy');
    return true;
  }

  /** Attack/stomp hitbox in front of the player, active for a short window. */
  getAttackHitbox() {
    if (this.attackTimer <= 0) return null;
    const fx = Math.sin(this.yaw);
    const fz = Math.cos(this.yaw);
    return {
      x: this.position.x + fx * 0.7,
      z: this.position.z + fz * 0.7,
      y: this.position.y + 0.7,
      radius: 0.75,
    };
  }

  update(dt, input, colliders, cameraYaw) {
    if (this.dead) return;

    this.walkTime += dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.hurtFlashTimer > 0) this.hurtFlashTimer -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.expressionOverrideTimer > 0) this.expressionOverrideTimer -= dt;

    const canControl = this.controlEnabled && !this.frozen;
    let moveX = 0, moveZ = 0;
    let wantJump = false, wantAction = false;

    if (canControl && input) {
      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;
      if (input.forward) moveZ -= 1;
      if (input.back) moveZ += 1;
      wantJump = input.jumpPressed;
      wantAction = input.actionPressed;
      if (input.jumpPressed) this.jumpBufferTimer = PHYSICS.jumpBuffer;
    }

    // Camera-relative movement: forward = away from camera.
    let dirX = 0, dirZ = 0;
    const len = Math.hypot(moveX, moveZ);
    if (len > 0.001) {
      const nx = moveX / len, nz = moveZ / len;
      const cy = cameraYaw || 0;
      const sinY = Math.sin(cy), cosY = Math.cos(cy);
      dirX = nx * cosY + nz * sinY;
      dirZ = -nx * sinY + nz * cosY;
    }
    const moving = len > 0.001;

    // Crouch: holding back while grounded and not moving forward strongly.
    this.crouching = canControl && this.grounded && input && input.back && !moving && !this.groundPounding;

    const speedMul = this.crouching ? PHYSICS.crouchSpeedMul : 1;
    const targetSpeed = moving ? PHYSICS.runSpeed * speedMul : 0;
    const targetVX = dirX * targetSpeed;
    const targetVZ = dirZ * targetSpeed;

    const accel = this.grounded ? PHYSICS.acceleration : PHYSICS.acceleration * PHYSICS.airControl;
    if (!this.groundPounding) {
      this.velocity.x = damp(this.velocity.x, targetVX, accel / 4, dt);
      this.velocity.z = damp(this.velocity.z, targetVZ, accel / 4, dt);
    } else {
      this.velocity.x = damp(this.velocity.x, 0, 8, dt);
      this.velocity.z = damp(this.velocity.z, 0, 8, dt);
    }

    if (moving && !this.crouching) {
      const targetYaw = Math.atan2(dirX, dirZ);
      this.yaw = lerpAngle(this.yaw, targetYaw, Math.min(1, PHYSICS.turnSpeed * dt));
    }

    // Coyote time + jump buffering.
    if (this.grounded) this.coyoteTimer = PHYSICS.coyoteTime; else this.coyoteTimer -= dt;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

    const canGroundJump = this.coyoteTimer > 0 && this.jumpCount === 0;
    const doJump = canControl && (wantJump || this.jumpBufferTimer > 0);

    if (doJump && canGroundJump) {
      this.velocity.y = PHYSICS.jumpVelocity;
      this.jumpCount = 1;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      SFX.play('jump');
    } else if (doJump && this.jumpCount === 1 && !this.grounded) {
      this.velocity.y = PHYSICS.doubleJumpVelocity;
      this.jumpCount = 2;
      this.jumpBufferTimer = 0;
      SFX.play('doubleJump');
      this.expressionOverrideTimer = 0.4;
      setExpression(this.model, 'surprised');
    }

    // Ground pound: action while airborne and not already pounding. Like
    // SM64 it starts with a beat of hang-time and a spin before the drop,
    // which is what makes the slam read as deliberate instead of instant.
    if (canControl && wantAction && !this.grounded && !this.groundPounding) {
      this.groundPounding = true;
      this.groundPoundLanded = false;
      this.groundPoundSpinTimer = PHYSICS.groundPoundSpinTime;
      this.velocity.set(0, 0, 0);
      SFX.play('groundPound');
    } else if (canControl && wantAction && this.grounded && this.attackTimer <= 0) {
      this.attackTimer = PHYSICS.punchTime;
      this.attackHasHit = false;
      this.model._punchSide *= -1; // alternate fists between swings
      if (this.power === 'fire' && this.onShootFireball) {
        // Fire swaps the melee swing for a thrown fireball - same input,
        // same windup animation, different payload.
        this.attackHasHit = true; // the fireball does the damage, not the fist
        const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
        this.onShootFireball(
          this.position.x + fx * 0.6,
          this.position.y + this.bodyHeight * 0.55,
          this.position.z + fz * 0.6,
          fx, fz,
        );
        SFX.play('fireball');
      } else {
        SFX.play('hit');
      }
    }

    // Gravity - suspended during the ground pound's spin windup.
    if (this.groundPoundSpinTimer > 0) {
      this.groundPoundSpinTimer -= dt;
      this.velocity.set(0, 0, 0);
      if (this.groundPoundSpinTimer <= 0) this.velocity.y = PHYSICS.groundPoundSpeed;
    } else if (!this.grounded) {
      this.velocity.y += PHYSICS.gravity * dt;
      this.velocity.y = Math.max(this.velocity.y, -30);
    }

    // Integrate + resolve. Crouching shrinks the effective collision height
    // so the player can duck under low overhangs that would otherwise wall
    // them off.
    const fullHeight = this.bodyHeight;
    const effHeight = this.crouching ? fullHeight * 0.55 : fullHeight;
    let nx = this.position.x + this.velocity.x * dt;
    let nz = this.position.z + this.velocity.z * dt;
    const resolved = resolveWalls(nx, this.position.y + 0.05, nz, this.bodyRadius, effHeight - 0.1, colliders);
    nx = resolved.x; nz = resolved.z;

    let ny = this.position.y + this.velocity.y * dt;

    const feetY = this.velocity.y <= 0 ? ny : this.position.y;
    const ground = sampleGround(nx, nz, feetY + 0.4, colliders);
    let grounded = false;
    let landedThisFrame = false;
    if (ground && this.velocity.y <= 0.01 && feetY <= ground.maxY + 0.45) {
      ny = ground.maxY;
      if (this.velocity.y < 0) landedThisFrame = true;
      this.velocity.y = 0;
      grounded = true;
      this.groundCollider = ground;
    } else {
      this.groundCollider = null;
    }

    // Ceiling bump.
    if (this.velocity.y > 0) {
      for (const col of colliders) {
        if (col.passthrough) continue;
        if (nx < col.minX - this.radius || nx > col.maxX + this.radius) continue;
        if (nz < col.minZ - this.radius || nz > col.maxZ + this.radius) continue;
        const head = ny + effHeight;
        if (head > col.minY && this.position.y + effHeight <= col.minY + 0.05) {
          ny = col.minY - effHeight;
          this.velocity.y = 0;
          break;
        }
      }
    }

    if (landedThisFrame) {
      if (this.groundPounding) {
        this.groundPounding = false;
        if (this.onGroundPoundImpact) this.onGroundPoundImpact(nx, ny, nz);
      }
      this.jumpCount = 0;
    }
    if (!grounded && this.groundPounding === false && this.jumpCount === 0 && !ground) {
      // walked off a ledge
      this.jumpCount = 1;
    }

    this.position.set(nx, ny, nz);
    this.grounded = grounded;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;

    const speedRatio = Math.hypot(this.velocity.x, this.velocity.z) / PHYSICS.runSpeed;
    let expr = null;
    if (this.expressionOverrideTimer <= 0) expr = null;
    animateCharacter(this.model, dt, {
      speedRatio,
      grounded: this.grounded,
      crouching: this.crouching,
      groundPounding: this.groundPounding,
      poundSpin: this.groundPoundSpinTimer > 0,
      attackT: this.attackTimer > 0 ? this.attackTimer / PHYSICS.punchTime : 0,
      walkTime: this.walkTime,
      talking: false,
      expression: this.expressionOverrideTimer > 0 ? undefined : 'idle',
    });

    // Mega scales the inner body pivot, so it multiplies cleanly with the
    // squash/stretch the animator applies to the outer group.
    const targetBodyScale = this.isMega ? this.megaScale : 1;
    const bodyScale = damp(this.model.body.scale.x, targetBodyScale, 9, dt);
    this.model.body.scale.setScalar(bodyScale);

    // Simple hurt flash (blink visibility) while invulnerable.
    if (this.invulnTimer > 0) {
      this.group.visible = Math.floor(this.invulnTimer * 14) % 2 === 0;
    } else {
      this.group.visible = true;
    }
  }
}
