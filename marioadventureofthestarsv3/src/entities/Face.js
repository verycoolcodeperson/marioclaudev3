import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Cheap expressive faces, SM64-toy-box style but drawn flat on a canvas and
// applied to a small plane stuck to the character's head. This gets us
// eyebrows / big eyes / mustaches / talk animation without any rigging or
// blendshapes - just swap the texture.
//
// Mouths stay small and are mostly covered by a mustache/beak whenever a
// character "idles"; while talking we only flash a tiny sliver open/closed
// beneath the mustache so there's motion without an ugly floating mouth.
// ---------------------------------------------------------------------------

const cache = new Map();
const SIZE = 64;

function draw(opts) {
  const {
    skin = '#ffc89b',
    eyeColor = '#2b2b2b',
    mustache = true,
    mustacheColor = '#4a2c14',
    browColor = '#4a2c14',
    expression = 'idle', // idle | happy | talkA | talkB | hurt | surprised | angry
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const eyeY = 26;
  const eyeXL = 18, eyeXR = 40;
  const eyeW = 9, eyeH = expression === 'hurt' ? 3 : 11;

  // whites
  if (expression !== 'angry') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(eyeXL - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH);
    ctx.fillRect(eyeXR - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH);
  }

  // pupils / expression-specific eyes
  ctx.fillStyle = eyeColor;
  if (expression === 'happy') {
    // upward curved squint (small arcs)
    ctx.fillRect(eyeXL - 4, eyeY, 8, 3);
    ctx.fillRect(eyeXR - 4, eyeY, 8, 3);
  } else if (expression === 'surprised') {
    ctx.beginPath(); ctx.arc(eyeXL, eyeY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeXR, eyeY, 4, 0, Math.PI * 2); ctx.fill();
  } else if (expression === 'hurt') {
    ctx.fillRect(eyeXL - 4, eyeY - 1, 8, 3);
    ctx.fillRect(eyeXR - 4, eyeY - 1, 8, 3);
  } else if (expression === 'angry') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(eyeXL - eyeW / 2, eyeY - 2, eyeW, 8);
    ctx.fillRect(eyeXR - eyeW / 2, eyeY - 2, eyeW, 8);
    ctx.fillStyle = eyeColor;
    ctx.fillRect(eyeXL - 2, eyeY - 1, 4, 4);
    ctx.fillRect(eyeXR - 2, eyeY - 1, 4, 4);
  } else {
    ctx.fillRect(eyeXL - 2, eyeY - 2, 4, 5);
    ctx.fillRect(eyeXR - 2, eyeY - 2, 4, 5);
  }

  // eyebrows
  ctx.fillStyle = browColor;
  if (expression === 'angry') {
    ctx.save();
    ctx.translate(eyeXL, eyeY - 9); ctx.rotate(0.35); ctx.fillRect(-6, -1, 12, 3); ctx.restore();
    ctx.save();
    ctx.translate(eyeXR, eyeY - 9); ctx.rotate(-0.35); ctx.fillRect(-6, -1, 12, 3); ctx.restore();
  } else if (expression === 'surprised') {
    ctx.fillRect(eyeXL - 6, eyeY - 11, 12, 2);
    ctx.fillRect(eyeXR - 6, eyeY - 11, 12, 2);
  } else {
    ctx.fillRect(eyeXL - 5, eyeY - 9, 10, 2);
    ctx.fillRect(eyeXR - 5, eyeY - 9, 10, 2);
  }

  // nose blob
  ctx.fillStyle = skin === '#8fce6a' ? '#7ab850' : (opts.noseColor || '#f2a878');
  ctx.beginPath();
  ctx.arc(SIZE / 2, 38, 6, 0, Math.PI * 2);
  ctx.fill();

  // mouth (small, mostly hidden beneath mustache)
  const mouthY = 46;
  ctx.fillStyle = '#8a3b2b';
  if (expression === 'surprised') {
    ctx.beginPath(); ctx.arc(SIZE / 2, mouthY + 2, 4, 0, Math.PI * 2); ctx.fill();
  } else if (expression === 'talkA') {
    ctx.fillRect(SIZE / 2 - 5, mouthY, 10, 5);
  } else if (expression === 'talkB') {
    ctx.fillRect(SIZE / 2 - 3, mouthY, 6, 2);
  } else if (expression === 'happy') {
    ctx.beginPath();
    ctx.arc(SIZE / 2, mouthY - 2, 6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8a3b2b';
    ctx.stroke();
  } else {
    ctx.fillRect(SIZE / 2 - 3, mouthY, 6, 1.5);
  }

  // mustache - bold "broom" shape (thick throughout, not a thin crescent)
  // so it reads clearly as Mario/Luigi's signature mustache even small.
  if (mustache) {
    ctx.fillStyle = mustacheColor;
    const my = mouthY - 4 + (expression === 'talkA' ? 2 : 0);
    ctx.fillRect(SIZE / 2 - 13, my, 26, 6);
    ctx.beginPath(); ctx.ellipse(SIZE / 2, my + 4, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(SIZE / 2 - 13, my + 5, 6, 5.5, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(SIZE / 2 + 13, my + 5, 6, 5.5, 0.2, 0, Math.PI * 2); ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function getFaceTexture(opts) {
  const key = JSON.stringify(opts);
  if (cache.has(key)) return cache.get(key);
  const tex = draw(opts);
  cache.set(key, tex);
  return tex;
}

/** Presets for the game's named characters - keeps call sites short. */
export const CHARACTER_FACES = {
  mario: { skin: '#ffc89b', mustacheColor: '#3a2415', browColor: '#3a2415' },
  luigi: { skin: '#ffc89b', mustacheColor: '#2b2b2b', browColor: '#2b2b2b' },
  toad: { skin: '#ffc89b', mustache: false, browColor: '#7a4c2a' },
  peach: { skin: '#ffe1c4', mustache: false, browColor: '#c98a3a', eyeColor: '#3a6bd6' },
  bowser: { skin: '#e8b23a', mustache: false, browColor: '#5c3a1a', noseColor: '#f2a878' },
  toadette: { skin: '#ffc89b', mustache: false, browColor: '#c9436a' },
};

export function getCharacterFace(character, expression = 'idle') {
  const base = CHARACTER_FACES[character] || CHARACTER_FACES.mario;
  return getFaceTexture({ ...base, expression });
}
