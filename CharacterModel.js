import * as THREE from 'three';
import { getCharacterFace } from './Face.js';

// ---------------------------------------------------------------------------
// Builds a small chunky low-poly character out of primitives (boxes,
// spheres, a cylinder or two) - reused for the Player AND every NPC. A
// small canvas face texture rides on the front of the head and swaps per
// expression (see Face.js). Geometries are cached/shared across every
// character instance to keep draw calls and memory cheap.
// ---------------------------------------------------------------------------

const geoCache = new Map();
function box(w, h, d) {
  const k = `b${w}_${h}_${d}`;
  if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(k);
}
function sphere(r) {
  const k = `s${r}`;
  if (!geoCache.has(k)) geoCache.set(k, new THREE.SphereGeometry(r, 10, 8));
  return geoCache.get(k);
}
function cyl(rt, rb, h, seg = 10) {
  const k = `c${rt}_${rb}_${h}`;
  if (!geoCache.has(k)) geoCache.set(k, new THREE.CylinderGeometry(rt, rb, h, seg));
  return geoCache.get(k);
}
function cone(r, h) {
  const k = `k${r}_${h}`;
  if (!geoCache.has(k)) geoCache.set(k, new THREE.ConeGeometry(r, h, 10));
  return geoCache.get(k);
}

const matCache = new Map();
function mat(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return matCache.get(color);
}

const PALETTES = {
  mario: { skin: 0xffc89b, shirt: 0xe6302c, overalls: 0x2255dd, cap: 0xe6302c, glove: 0xffffff, shoe: 0x6b4226 },
  luigi: { skin: 0xffc89b, shirt: 0x35a54a, overalls: 0x2255dd, cap: 0x35a54a, glove: 0xffffff, shoe: 0x6b4226 },
  toad: { skin: 0xffc89b, shirt: 0xffffff, overalls: 0x3a6bd6, cap: 0xffffff, glove: 0xffffff, shoe: 0x8b5a2b },
  peach: { skin: 0xffe1c4, shirt: 0xff8fc7, overalls: 0xff8fc7, cap: 0xffe066, glove: 0xffffff, shoe: 0xff8fc7, hair: 0xffe066 },
  daisy: { skin: 0xffe1c4, shirt: 0xff9d2e, overalls: 0xff9d2e, cap: 0xffffff, glove: 0xffffff, shoe: 0xffb84d, hair: 0x8a5a2b },
  bowser: { skin: 0xe8b23a, shirt: 0x4a7d3c, overalls: 0x4a7d3c, cap: 0xe8b23a, glove: 0xe8b23a, shoe: 0xe8b23a, shell: 0x2f8a3a },
};

function addCap(head, character, p) {
  if (character === 'mario' || character === 'luigi') {
    const cap = new THREE.Group();
    const dome = new THREE.Mesh(cyl(0.26, 0.26, 0.16, 10), mat(p.cap));
    dome.position.set(0, 0.24, -0.01);
    const brim = new THREE.Mesh(box(0.3, 0.05, 0.22), mat(p.cap));
    brim.position.set(0, 0.15, 0.22);
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), mat(0xffffff));
    badge.position.set(0, 0.24, 0.24);
    cap.add(dome, brim, badge);
    cap.castShadow = true;
    head.add(cap);
  } else if (character === 'toad') {
    // Toad's mushroom cap is his whole silhouette - make it big and
    // overhanging, wider than the head itself, with bold red spots.
    const capGroup = new THREE.Group();
    const domeGeo = sphere(0.46);
    const dome = new THREE.Mesh(domeGeo, mat(0xffffff));
    dome.scale.set(1.15, 0.72, 1.15);
    dome.position.set(0, 0.2, -0.02);
    capGroup.add(dome);
    const spots = [[-0.24, 0.34, 0.16], [0.24, 0.34, 0.16], [0, 0.4, -0.2], [-0.15, 0.36, -0.28], [0.15, 0.36, -0.28]];
    for (const [x, y, z] of spots) {
      const spot = new THREE.Mesh(sphere(0.1), mat(0xe6302c));
      spot.position.set(x, y, z);
      capGroup.add(spot);
    }
    capGroup.castShadow = true;
    head.add(capGroup);
  } else if (character === 'peach' || character === 'daisy') {
    const hair = new THREE.Group();
    const back = new THREE.Mesh(sphere(0.33), mat(p.hair));
    back.scale.set(1, 1.05, 1);
    back.position.set(0, 0.05, -0.05);
    const crown = new THREE.Mesh(cyl(0.14, 0.18, 0.14, 8), mat(character === 'daisy' ? 0xffffff : 0xffe066));
    crown.position.set(0, 0.28, 0);
    hair.add(back, crown);
    hair.castShadow = true;
    head.add(hair);
  } else if (character === 'bowser') {
    const spikes = new THREE.Group();
    const positions = [[-0.14, 0.24, -0.05], [0, 0.28, -0.08], [0.14, 0.24, -0.05]];
    for (const [x, y, z] of positions) {
      const spike = new THREE.Mesh(cone(0.07, 0.18), mat(0xffffff));
      spike.position.set(x, y, z);
      spikes.add(spike);
    }
    spikes.castShadow = true;
    head.add(spikes);
  }
}

export function createCharacterModel(character = 'mario', scale = 1) {
  const p = PALETTES[character] || PALETTES.mario;
  const group = new THREE.Group();
  // Everything hangs off an inner pivot so animation can lean the body
  // forward or spin it (ground pound) around the character's OWN axes,
  // while the outer group stays free for position + facing yaw.
  const body = new THREE.Group();
  group.add(body);

  const legGeo = box(0.34, 0.5, 0.34);
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.19, 0.55, 0);
  const leftLeg = new THREE.Mesh(legGeo, mat(p.overalls));
  leftLeg.position.set(0, -0.25, 0);
  leftLeg.castShadow = true;
  const leftShoe = new THREE.Mesh(box(0.36, 0.14, 0.42), mat(p.shoe));
  leftShoe.position.set(0, -0.48, 0.04);
  leftShoe.castShadow = true;
  leftLegPivot.add(leftLeg, leftShoe);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.19, 0.55, 0);
  const rightLeg = new THREE.Mesh(legGeo, mat(p.overalls));
  rightLeg.position.set(0, -0.25, 0);
  rightLeg.castShadow = true;
  const rightShoe = new THREE.Mesh(box(0.36, 0.14, 0.42), mat(p.shoe));
  rightShoe.position.set(0, -0.48, 0.04);
  rightShoe.castShadow = true;
  rightLegPivot.add(rightLeg, rightShoe);

  body.add(leftLegPivot, rightLegPivot);

  const torso = new THREE.Mesh(box(0.6, 0.46, 0.34), mat(p.overalls));
  torso.position.set(0, 0.85, 0);
  torso.castShadow = true;
  body.add(torso);

  const chest = new THREE.Mesh(box(0.48, 0.2, 0.36), mat(p.shirt));
  chest.position.set(0, 1.05, 0);
  chest.castShadow = true;
  body.add(chest);

  if (character === 'bowser') {
    const shell = new THREE.Mesh(sphere(0.4), mat(p.shell));
    shell.scale.set(1, 0.85, 0.7);
    shell.position.set(0, 0.95, -0.22);
    shell.castShadow = true;
    body.add(shell);
  }

  const armGeo = box(0.2, 0.46, 0.2);
  // Slightly oversized "glove" hands read as more toylike/expressive at a
  // distance, matching the chunky SM3DW character proportions.
  const handGeo = sphere(0.17);
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.4, 1.08, 0);
  const leftArm = new THREE.Mesh(armGeo, mat(p.shirt));
  leftArm.position.set(0, -0.23, 0);
  leftArm.castShadow = true;
  const leftHand = new THREE.Mesh(handGeo, mat(p.glove));
  leftHand.position.set(0, -0.5, 0);
  leftHand.castShadow = true;
  leftArmPivot.add(leftArm, leftHand);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.4, 1.08, 0);
  const rightArm = new THREE.Mesh(armGeo, mat(p.shirt));
  rightArm.position.set(0, -0.23, 0);
  rightArm.castShadow = true;
  const rightHand = new THREE.Mesh(handGeo, mat(p.glove));
  rightHand.position.set(0, -0.5, 0);
  rightHand.castShadow = true;
  rightArmPivot.add(rightArm, rightHand);

  body.add(leftArmPivot, rightArmPivot);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.43, 0);
  // A slightly oversized head (vs. a realistic body ratio) is the classic
  // toylike SM3DW proportion - reads as friendlier and more expressive.
  const headMesh = new THREE.Mesh(box(0.5, 0.46, 0.48), mat(p.skin));
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  const faceTex = getCharacterFace(character, 'idle');
  // Lambert, NOT Basic: an unlit face renders at full texture brightness
  // while the Lambert head around it is shaded, so the face reads as a
  // glowing sticker floating on a darker head. Matching the material makes
  // the face take the same light as the rest of the character.
  const faceMat = new THREE.MeshLambertMaterial({ map: faceTex, transparent: true });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.42), faceMat);
  face.position.set(0, -0.01, 0.241);
  headGroup.add(face);

  addCap(headGroup, character, p);
  body.add(headGroup);

  group.scale.setScalar(scale);
  group.traverse((o) => { o.frustumCulled = true; });

  return {
    group,
    body,
    character,
    parts: { leftLeg: leftLegPivot, rightLeg: rightLegPivot, leftArm: leftArmPivot, rightArm: rightArmPivot, torso, chest, head: headGroup },
    faceMesh: face,
    _expr: 'idle',
    _talkTimer: 0,
    _punchSide: 1,
  };
}

/** Swap the face texture (cheap - textures are cached by Face.js). */
export function setExpression(model, expression) {
  if (model._expr === expression) return;
  model._expr = expression;
  model.faceMesh.material.map = getCharacterFace(model.character, expression);
  model.faceMesh.material.needsUpdate = true;
}

const approach = (current, target, dt, rate = 16) => current + (target - current) * Math.min(1, dt * rate);

/**
 * Drives every character pose: idle/talk mouth-flap, a walk that builds into
 * a leaning run, an SM64-style alternating punch, the ground pound's spin →
 * tuck → slam, and jump squash-stretch.
 *
 * `state`: {
 *   speedRatio 0..1+, grounded, crouching, groundPounding, talking, walkTime,
 *   attackT 0..1   - punch progress, 1 at the windup and falling to 0
 *   poundSpin bool - the hover-and-spin beat before the slam drops
 * }
 */
export function animateCharacter(model, dt, state) {
  const {
    speedRatio = 0, grounded = true, crouching = false, groundPounding = false,
    talking = false, walkTime = 0, attackT = 0, poundSpin = false,
  } = state;

  if (talking) {
    model._talkTimer += dt;
    setExpression(model, Math.floor(model._talkTimer * 7) % 2 === 0 ? 'talkA' : 'talkB');
  } else if (state.expression) {
    setExpression(model, state.expression);
  } else {
    setExpression(model, 'idle');
  }

  const parts = model.parts;
  const spd = Math.min(1, speedRatio);
  // Stride quickens AND widens with speed, so a run reads as a different
  // gait from a walk rather than the same cycle played faster.
  const stride = 7 + spd * 6;
  const swing = Math.sin(walkTime * stride) * spd * (0.55 + spd * 0.55);
  let leanX = spd * spd * 0.28;      // lean into a sprint
  let spinY = 0;
  let targetScaleY = 1, targetScaleXZ = 1;

  if (attackT > 0) {
    // Punch: one arm fires straight out and snaps back, shoulders twist with
    // it, and the punching side alternates between swings.
    const thrust = Math.sin(Math.min(1, 1 - attackT) * Math.PI); // 0 → 1 → 0
    const side = model._punchSide;
    const lead = side > 0 ? parts.rightArm : parts.leftArm;
    const trail = side > 0 ? parts.leftArm : parts.rightArm;
    lead.rotation.x = approach(lead.rotation.x, -2.5 * thrust - 0.1, dt, 30);
    trail.rotation.x = approach(trail.rotation.x, 0.7 * thrust, dt, 24);
    parts.leftLeg.rotation.x = approach(parts.leftLeg.rotation.x, swing * 0.3, dt);
    parts.rightLeg.rotation.x = approach(parts.rightLeg.rotation.x, -swing * 0.3, dt);
    spinY = -side * thrust * 0.55;
    leanX = thrust * 0.22;
    targetScaleXZ = 1 + thrust * 0.06;
  } else if (poundSpin) {
    // Hang in the air and whip around once before dropping.
    model._punchSide *= -1;
    spinY = walkTime * 26;
    parts.leftArm.rotation.x = approach(parts.leftArm.rotation.x, -2.2, dt, 22);
    parts.rightArm.rotation.x = approach(parts.rightArm.rotation.x, -2.2, dt, 22);
    parts.leftLeg.rotation.x = approach(parts.leftLeg.rotation.x, -0.5, dt, 22);
    parts.rightLeg.rotation.x = approach(parts.rightLeg.rotation.x, -0.5, dt, 22);
    leanX = -0.15;
    targetScaleY = 0.9; targetScaleXZ = 1.1;
  } else if (groundPounding) {
    // The slam itself: knees tucked up under a seated pose, arms flung wide.
    parts.leftLeg.rotation.x = approach(parts.leftLeg.rotation.x, 1.5, dt, 26);
    parts.rightLeg.rotation.x = approach(parts.rightLeg.rotation.x, 1.5, dt, 26);
    parts.leftArm.rotation.x = approach(parts.leftArm.rotation.x, -0.5, dt, 26);
    parts.rightArm.rotation.x = approach(parts.rightArm.rotation.x, -0.5, dt, 26);
    parts.leftArm.rotation.z = approach(parts.leftArm.rotation.z, 1.0, dt, 26);
    parts.rightArm.rotation.z = approach(parts.rightArm.rotation.z, -1.0, dt, 26);
    leanX = -0.25;
    targetScaleY = 0.82; targetScaleXZ = 1.16;
  } else if (grounded && !crouching) {
    parts.leftLeg.rotation.x = swing;
    parts.rightLeg.rotation.x = -swing;
    parts.leftArm.rotation.x = -swing * 0.85;
    parts.rightArm.rotation.x = swing * 0.85;
    parts.leftArm.rotation.z = approach(parts.leftArm.rotation.z, spd * 0.18, dt);
    parts.rightArm.rotation.z = approach(parts.rightArm.rotation.z, -spd * 0.18, dt);
  } else if (crouching) {
    parts.leftLeg.rotation.x = approach(parts.leftLeg.rotation.x, 0.2, dt);
    parts.rightLeg.rotation.x = approach(parts.rightLeg.rotation.x, 0.2, dt);
    parts.leftArm.rotation.x = approach(parts.leftArm.rotation.x, -0.3, dt);
    parts.rightArm.rotation.x = approach(parts.rightArm.rotation.x, -0.3, dt);
    targetScaleY = 0.62; targetScaleXZ = 1.12;
  } else {
    // Airborne: arms up, trailing leg tucked.
    parts.leftLeg.rotation.x = approach(parts.leftLeg.rotation.x, 0.25, dt);
    parts.rightLeg.rotation.x = approach(parts.rightLeg.rotation.x, -0.15, dt);
    parts.leftArm.rotation.x = approach(parts.leftArm.rotation.x, -1.6, dt);
    parts.rightArm.rotation.x = approach(parts.rightArm.rotation.x, -1.9, dt);
    targetScaleY = 1.08; targetScaleXZ = 0.94;
  }

  // Reset the arm splay whenever we're not in a pose that sets it.
  if (!groundPounding && !crouching && !(grounded && !crouching)) {
    parts.leftArm.rotation.z = approach(parts.leftArm.rotation.z, 0, dt);
    parts.rightArm.rotation.z = approach(parts.rightArm.rotation.z, 0, dt);
  }

  model.body.rotation.x = approach(model.body.rotation.x, leanX, dt, 12);
  model.body.rotation.y = poundSpin ? spinY : approach(model.body.rotation.y % (Math.PI * 2), spinY, dt, 20);

  model.group.scale.y = approach(model.group.scale.y, targetScaleY, dt, 14);
  model.group.scale.x = approach(model.group.scale.x, targetScaleXZ, dt, 14);
  model.group.scale.z = approach(model.group.scale.z, targetScaleXZ, dt, 14);
}
