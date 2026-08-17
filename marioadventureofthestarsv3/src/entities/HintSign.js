import { createSign } from './Props.js';
import { distance2D } from '../core/Collision.js';

// ---------------------------------------------------------------------------
// A lightweight tutorial tip: just a signpost prop with a short line of
// text that appears in the HUD prompt while a player stands near it - no
// character model, no dialogue box, no button press needed. Used instead
// of spawning another NPC every time we want to say one thing (a level
// full of identical Toads standing everywhere looks like a clone army).
// ---------------------------------------------------------------------------
export function createHintSign(spec) {
  const { x, y, z, text, radius = 2.2, rotationY = 0 } = spec;
  const group = createSign(x, y, z, { rotationY, icon: '💡' });
  return {
    type: 'hintSign', mesh: group, text, radius,
    position: { x, y, z },
    update() {},
  };
}
