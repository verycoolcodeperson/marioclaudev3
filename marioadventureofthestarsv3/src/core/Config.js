// ---------------------------------------------------------------------------
// Central game configuration.
// Change keybindings, physics tuning, or global constants HERE - nowhere else.
// ---------------------------------------------------------------------------

export const KEYBINDS = {
  p1: {
    left: ['KeyA'],
    right: ['KeyD'],
    forward: ['KeyW'],
    back: ['KeyS'],
    jump: ['Space'],
    action: ['ShiftLeft', 'ShiftRight'],
    pause: ['Escape'],
  },
  p2: {
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
    forward: ['ArrowUp'],
    back: ['ArrowDown'],
    jump: ['Enter', 'NumpadEnter'],
    action: ['ControlRight', 'KeyM'],
    pause: ['Escape'],
  },
};

export const PHYSICS = {
  gravity: -28,
  walkSpeed: 6.2,
  runSpeed: 10.5,
  airControl: 0.85,
  jumpVelocity: 11.5,
  doubleJumpVelocity: 12.5,
  groundPoundSpeed: -22,
  friction: 10,
  acceleration: 40,
  crouchSpeedMul: 0.45,
  turnSpeed: 12,
  coyoteTime: 0.12,
  jumpBuffer: 0.12,
};

export const CAMERA = {
  sideOffset: 13, // fixed distance to the side of the action (Super Mario 3D World style)
  height: 3.4,
  lookHeight: 1.4,
  followLerp: 5,       // how briskly the camera pans along X to track the player
  heightLerp: 1.4,      // much slower - elevation/depth changes drift instead of bobbing
  minDistance: 4,
  multiplayerMaxOffset: 19,
  collisionPadding: 0.4,
};

export const WORLD_THEMES = [
  { id: 1, key: 'grassland', name: 'Greenhorn Fields', sky: 0x7ec0ee, fog: 0xbfe6ff, ground: 0x4caf50, accent: 0x2e7d32, secondary: 0x8bc34a, icon: '🌱' },
  { id: 2, key: 'desert', name: 'Dustdune Wastes', sky: 0xffd98a, fog: 0xffe9bf, ground: 0xe0b357, accent: 0xc98a3a, secondary: 0xf2d98a, icon: '🌵' },
  { id: 3, key: 'snow', name: 'Frostpeak Range', sky: 0xdff2ff, fog: 0xf0faff, ground: 0xf2f8ff, accent: 0x9fd4ea, secondary: 0xcfeaf7, icon: '❄️' },
  { id: 4, key: 'forest', name: 'Mossglow Woods', sky: 0x8fd6a0, fog: 0xcdeccf, ground: 0x3f7d43, accent: 0x27502b, secondary: 0x6cae55, icon: '🌲' },
  { id: 5, key: 'ocean', name: 'Coral Cove', sky: 0x6fd7e6, fog: 0xbdf1f7, ground: 0xe8d6a0, accent: 0x1a8fa8, secondary: 0x3fc1d6, icon: '🌊' },
  { id: 6, key: 'lava', name: 'Cinderpeak Caldera', sky: 0x3a1414, fog: 0x5c1f14, ground: 0x4a3226, accent: 0xff6a29, secondary: 0x9c2c1a, icon: '🔥' },
  { id: 7, key: 'sky', name: 'Cloudtop Heights', sky: 0xaee2ff, fog: 0xe8f7ff, ground: 0xfff6dd, accent: 0xffd76a, secondary: 0xffffff, icon: '☁️' },
  { id: 8, key: 'castle', name: "Bowser's Keep", sky: 0x241a2e, fog: 0x362447, ground: 0x5b4a63, accent: 0x2b1f33, secondary: 0x7a5c8a, icon: '🏰' },
];

export const STORAGE_KEY = 'mario3d_adventure_save_v1';

export const DEBUG = {
  showColliders: false,
};
