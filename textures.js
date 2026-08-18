import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Tiny hand-drawn canvas textures for a cheap "slightly pixelated" look.
// Every texture is generated once (small canvas, NearestFilter) and cached,
// so we never load external image assets and stay very light on memory.
// ---------------------------------------------------------------------------

const cache = new Map();

function finalize(canvas, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function ctx2d(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return { canvas, ctx: canvas.getContext('2d') };
}

function hex(c) {
  return typeof c === 'number' ? `#${c.toString(16).padStart(6, '0')}` : c;
}

function shade(hexColor, amt) {
  const c = new THREE.Color(hexColor);
  if (amt > 0) c.lerp(new THREE.Color(0xffffff), amt);
  else c.lerp(new THREE.Color(0x000000), -amt);
  return `#${c.getHexString()}`;
}

/** Speckled grass-top texture with tiny darker/lighter flecks + blade dashes. */
export function grassTexture(base = 0x4caf50, key = 'grass') {
  const cacheKey = `grass_${base}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const size = 16;
  const { canvas, ctx } = ctx2d(size);
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    ctx.fillStyle = Math.random() > 0.5 ? shade(base, 0.18) : shade(base, -0.18);
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = finalize(canvas, 6, 6);
  cache.set(cacheKey, tex);
  return tex;
}

/** Generic speckled ground/rock/sand texture (flat noise). */
export function speckleTexture(base, spread = 0.15, repeat = 6) {
  const cacheKey = `speck_${base}_${spread}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const size = 16;
  const { canvas, ctx } = ctx2d(size);
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const amt = (Math.random() - 0.5) * 2 * spread;
    ctx.fillStyle = shade(base, amt);
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = finalize(canvas, repeat, repeat);
  cache.set(cacheKey, tex);
  return tex;
}

/** Brick / block pattern used for platforms, castle walls, question-ish blocks. */
export function brickTexture(base = 0xc9743a, mortar = 0x7a4726, repeat = 2) {
  const cacheKey = `brick_${base}_${mortar}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const size = 16;
  const { canvas, ctx } = ctx2d(size);
  ctx.fillStyle = hex(mortar);
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = hex(base);
  ctx.fillRect(1, 1, 6, 6);
  ctx.fillRect(9, 1, 6, 6);
  ctx.fillRect(5, 9, 6, 6);
  ctx.fillRect(13, 9, 2, 6);
  ctx.fillRect(0, 9, 4, 6);
  const tex = finalize(canvas, repeat, repeat);
  cache.set(cacheKey, tex);
  return tex;
}

/** Wood plank stripes for bridges/signs. */
export function plankTexture(base = 0x9c7040) {
  const cacheKey = `plank_${base}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const size = 16;
  const { canvas, ctx } = ctx2d(size);
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = shade(base, -0.25);
  ctx.fillRect(0, 0, size, 1);
  ctx.fillRect(0, 8, size, 1);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = shade(base, (Math.random() - 0.5) * 0.2);
    ctx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * 8), 3, 1);
  }
  const tex = finalize(canvas, 3, 1);
  cache.set(cacheKey, tex);
  return tex;
}

/** Checker pattern (goal platforms, castle floors). */
export function checkerTexture(a = 0xffffff, b = 0x222222, repeat = 4) {
  const cacheKey = `check_${a}_${b}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const size = 8;
  const { canvas, ctx } = ctx2d(size);
  ctx.fillStyle = hex(a);
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = hex(b);
  ctx.fillRect(0, 0, 4, 4);
  ctx.fillRect(4, 4, 4, 4);
  const tex = finalize(canvas, repeat, repeat);
  cache.set(cacheKey, tex);
  return tex;
}

/** Water / lava wave stripes with subtle banding. */
export function waveTexture(base = 0x1a8fa8, highlight = 0x3fc1d6, repeat = 4) {
  const cacheKey = `wave_${base}_${highlight}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const size = 16;
  const { canvas, ctx } = ctx2d(size);
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = hex(highlight);
  for (let y = 0; y < size; y += 4) {
    ctx.fillRect(0, y, size, 1);
  }
  const tex = finalize(canvas, repeat, repeat);
  cache.set(cacheKey, tex);
  return tex;
}

/** The classic yellow "?" Lucky Block face, with corner rivets. */
export function questionBlockTexture() {
  const cacheKey = 'qblock';
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const size = 32;
  const { canvas, ctx } = ctx2d(size);
  ctx.fillStyle = '#f2a83c';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#8a5a1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  for (const [rx, ry] of [[4, 4], [size - 4, 4], [4, size - 4], [size - 4, size - 4]]) {
    ctx.fillStyle = '#8a5a1a';
    ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#8a5a1a';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', size / 2 + 1, size / 2 + 2);
  ctx.fillStyle = '#fff2c8';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('?', size / 2, size / 2 + 1);
  const tex = finalize(canvas, 1, 1);
  cache.set(cacheKey, tex);
  return tex;
}

/** The dull "used" block face left behind after a Lucky Block is hit. */
export function usedBlockTexture() {
  const cacheKey = 'ublock';
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const size = 16;
  const { canvas, ctx } = ctx2d(size);
  ctx.fillStyle = '#9c7a52';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#6b4a2b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
  const tex = finalize(canvas, 1, 1);
  cache.set(cacheKey, tex);
  return tex;
}

/** A signboard-sized texture with a big emoji icon on it (world theme markers). */
export function iconSignTexture(emoji, bg = 0xe8c88a) {
  const cacheKey = `icon_${emoji}_${bg}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const w = 128, h = 80;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = hex(bg);
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = shade(bg, -0.3);
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.font = `${h * 0.62}px "Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(cacheKey, tex);
  return tex;
}

export function clearTextureCache() {
  cache.clear();
}
