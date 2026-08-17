import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Shared lighting rig used by every scene (gameplay levels, hub/world map,
// title, ending). Centralized so a lighting fix only has to happen once.
//
// The hemisphere light's "ground" color is deliberately kept neutral
// (not tinted to each theme's grass/sand/etc color) - a saturated ground
// bounce color washes onto every character material and made Mario look
// green while standing on grass. The directional sun is angled to the
// side for real shadow modeling instead of a flat top-down look.
// ---------------------------------------------------------------------------
export function setupSceneLighting(scene, skyColor, { shadowSize = 28, intensity = 1.3 } = {}) {
  const hemi = new THREE.HemisphereLight(skyColor, 0x6b6659, 0.62);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3d9, intensity);
  sun.position.set(11, 15, -7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -shadowSize;
  sun.shadow.camera.right = shadowSize;
  sun.shadow.camera.top = shadowSize;
  sun.shadow.camera.bottom = -shadowSize;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.002;
  scene.add(sun);

  // Soft cool fill from the opposite side - cheap (no shadow casting) but
  // keeps shadowed faces from going fully flat/black.
  const fill = new THREE.DirectionalLight(0xbcd8ff, 0.28);
  fill.position.set(-9, 6, 8);
  scene.add(fill);

  return { hemi, sun, fill };
}
