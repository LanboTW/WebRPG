import { Graphics } from 'pixi.js';
import { limb, lin, P, rad, spline, strip } from '../engine/draw';
import type { OutfitDef, WeaponDef } from './equipment';
import { SKIN } from './palette';

/** Static body parts, each drawn in its bone's local space. */

export function drawNeck(g: Graphics): void {
  spline(g, P(-6, 10, -5.4, -2, -4.6, -14, 1, -16, 5.4, -12.5, 5, -2, 6.6, 10), true)
    .fill(lin([[0, SKIN.shade], [0.6, SKIN.base], [1, SKIN.light]], 0, 0, 1, 0))
    .stroke({ width: 0.8, color: SKIN.line, alpha: 0.7 });
  // shadow cast by the jaw
  spline(g, P(-5, -11, 0, -7.5, 5.2, -9.5, 5.4, -14, 1, -16, -4.6, -14), true).fill({ color: SKIN.deep, alpha: 0.35 });
  // collarbone hint + sternocleido line
  spline(g, P(3.5, -9, 4.4, -3, 5.8, 3)).stroke({ width: 0.6, color: SKIN.shade, alpha: 0.7, cap: 'round' });
}

function cloud(g: Graphics, x: number, y: number, s: number, color: string, alpha = 0.8): void {
  // auspicious-cloud motif (祥雲)
  g.moveTo(x - 6 * s, y + 1 * s)
    .bezierCurveTo(x - 6 * s, y - 3 * s, x - 1 * s, y - 3 * s, x - 1 * s, y)
    .bezierCurveTo(x - 1 * s, y - 5 * s, x + 6 * s, y - 5 * s, x + 5 * s, y)
    .bezierCurveTo(x + 8 * s, y - 1 * s, x + 9 * s, y + 3 * s, x + 6 * s, y + 3 * s)
    .moveTo(x + 1.5 * s, y - 0.5 * s)
    .bezierCurveTo(x + 1.5 * s, y - 2.5 * s, x + 3.5 * s, y - 2.5 * s, x + 3.2 * s, y - 0.5 * s)
    .stroke({ width: 0.7 * s, color, alpha, cap: 'round', join: 'round' });
}

function flame(g: Graphics, x: number, y: number, s: number, color: string): void {
  g.moveTo(x, y + 4 * s)
    .bezierCurveTo(x - 4 * s, y + 1 * s, x - 1 * s, y - 3 * s, x - 2 * s, y - 7 * s)
    .bezierCurveTo(x + 2 * s, y - 4 * s, x + 4 * s, y - 1 * s, x + 2 * s, y + 4 * s)
    .stroke({ width: 0.7 * s, color, alpha: 0.85, cap: 'round', join: 'round' });
}

/** Upper torso in chest-bone space: origin at the belt, shoulders at y≈-78, front = +x. */
export function drawTorso(g: Graphics, o: OutfitDef): void {
  const body = P(-12, 4, -12.6, -18, -15.6, -44, -17, -62, -13.5, -73.5, -5, -78.5, 4.5, -78.5, 11.5, -72, 17.5, -63, 21.6, -54, 20.8, -46.5, 15.6, -41, 11.6, -28, 11.8, 4);
  spline(g, body, true, 0.45)
    .fill(lin([[0, o.robe[2]], [0.45, o.robe[1]], [0.85, o.robe[0]], [1, o.robe[1]]], 0, 0.4, 1, 0.6))
    .stroke({ width: 1.1, color: o.robeLine, join: 'round' });
  // form shadows: under bust, side, back
  spline(g, P(20.8, -46.5, 15.6, -41, 12, -33, 11, -40, 14.5, -45.5), true).fill({ color: o.robe[2], alpha: 0.55 });
  spline(g, P(-16.5, -46, -14, -20, -13, 4, -9, 4, -10, -24, -12, -50, -13, -66), true).fill({ color: o.robe[2], alpha: 0.4 });
  g.ellipse(16.5, -57, 4.5, 5).fill({ fill: rad([[0, '#ffffff'], [1, '#ffffff00']]), alpha: 0.35 });
  // cloth folds from bust to waist
  for (const f of [P(15, -42, 11.5, -26, 10, -6), P(9, -45, 6, -26, 5.5, -4), P(-4, -60, -6, -36, -5, -6)]) {
    spline(g, f).stroke({ width: 0.7, color: o.robe[2], alpha: 0.6, cap: 'round' });
  }
  // inner layer showing at the collar V
  spline(g, P(-1, -79.5, 6.5, -79, 10.6, -68, 11.4, -60, 8.6, -66, 3.5, -75), true)
    .fill(lin([[0, o.inner[0]], [1, o.inner[1]]], 0, 0, 1, 1))
    .stroke({ width: 0.6, color: o.robeLine, alpha: 0.6 });
  // lapel trim crossing the chest
  strip(g, P(4.5, -80, 9.5, -71, 14.6, -60, 16.6, -50, 14.6, -40, 12.5, -24, 12, 3), [3.6, 3.8, 3.8, 3.6, 3.4, 3.2, 3.2])
    .fill(lin([[0, o.trimLight], [1, o.trim]], 0, 0, 1, 0))
    .stroke({ width: 0.5, color: o.robeLine, alpha: 0.8 });
  // back collar
  strip(g, P(-8, -76, -3, -80.5, 4, -81), [3, 3.4, 3]).fill(o.trim).stroke({ width: 0.5, color: o.robeLine, alpha: 0.8 });
  if (o.pattern === 'cloud') {
    cloud(g, -6, -60, 1, o.embroidery, 0.75);
    cloud(g, -1, -22, 0.8, o.embroidery, 0.6);
  } else if (o.pattern === 'flame') {
    flame(g, -7, -58, 1.2, o.embroidery);
    flame(g, -1, -54, 0.9, o.embroidery);
    flame(g, -4, -20, 1, o.embroidery);
  } else {
    // stitched diagonal straps for the night outfit
    strip(g, P(-15, -66, -4, -46, 6, -24, 11, -8), [3, 3, 3, 3]).fill({ color: o.trim, alpha: 0.35 });
  }
}

/** Sash in spine-bone space: centred on the belt line. */
export function drawSash(g: Graphics, o: OutfitDef): void {
  spline(g, P(-14.5, -8, -2, -9.5, 13.8, -8.5, 14.6, 0, 14, 8.5, -1, 9.6, -14.8, 8.5, -15.4, 0), true, 0.35)
    .fill(lin([[0, o.sash[1]], [0.6, o.sash[0]], [1, o.sash[1]]], 0, 0, 1, 0))
    .stroke({ width: 1, color: '#0d1416', alpha: 0.8 });
  g.moveTo(-14.8, -5).bezierCurveTo(-4, -6.4, 6, -6.4, 14.4, -5.4).moveTo(-15, 5.6).bezierCurveTo(-4, 6.8, 6, 6.8, 14.4, 5.8)
    .stroke({ width: 0.8, color: o.embroidery, alpha: 0.75 });
  // knot and gem
  spline(g, P(6, -7, 13, -9, 15.5, -2, 13.5, 6, 7, 7, 5.5, 0), true).fill(lin([[0, o.sash[0]], [1, o.sash[1]]])).stroke({ width: 0.7, color: '#0d1416', alpha: 0.8 });
  g.circle(10, -0.5, 3.2).fill(rad([[0, '#ffffff'], [0.35, o.sashGem], [1, o.sash[1]]], 0.4, 0.35, 0.6)).stroke({ width: 0.7, color: o.embroidery });
}

/** Robe over the hips in root-bone space: from the belt (y-28) down over the thigh tops. */
export function drawHipSkirt(g: Graphics, o: OutfitDef): void {
  spline(g, P(-14, -30, 13, -30, 15.5, -14, 18.5, 8, 19.5, 30, 6, 33, -8, 32.5, -20, 29, -19, 4, -16, -16), true, 0.4)
    .fill(lin([[0, o.robe[2]], [0.5, o.robe[1]], [0.9, o.robe[0]], [1, o.robe[1]]], 0, 0.3, 1, 0.5))
    .stroke({ width: 1.1, color: o.robeLine, join: 'round' });
  for (const f of [P(8, -24, 10, 0, 12, 30), P(-2, -24, -3, 4, -4, 31), P(-11, -24, -14, 4, -15, 29)]) spline(g, f).stroke({ width: 0.7, color: o.robe[2], alpha: 0.65, cap: 'round' });
  // front edge trim continuing from the lapel
  strip(g, P(13, -30, 15, -12, 17.8, 10, 18.6, 31), [3.2, 3.2, 3.2, 3.2]).fill(lin([[0, o.trimLight], [1, o.trim]], 0, 0, 1, 0));
  }

export function drawThigh(g: Graphics, o: OutfitDef): void {
  limb(g, 86, 31, 28, 19, 2.5, 1.5, 0.35)
    .fill(lin([[0, o.pants[1]], [0.55, o.pants[0]], [1, o.pants[1]]], 0, 0, 1, 0))
    .stroke({ width: 1, color: '#101318', alpha: 0.85, join: 'round' });
  for (const f of [P(-6, 20, -2, 45, -4, 70), P(5, 30, 7, 55, 4, 78)]) spline(g, f).stroke({ width: 0.7, color: o.pants[1], alpha: 0.9, cap: 'round' });
}

export function drawShin(g: Graphics, o: OutfitDef): void {
  // pants bloused over the boot top, then the boot shaft
  spline(g, P(-9.5, -3, 9.5, -3, 10.5, 10, 9, 22, -10, 22, -11.5, 10), true)
    .fill(lin([[0, o.pants[1]], [0.55, o.pants[0]], [1, o.pants[1]]], 0, 0, 1, 0))
    .stroke({ width: 0.9, color: '#101318', alpha: 0.85 });
  spline(g, P(-9, 18, 8.6, 18, 9.2, 34, 7, 58, 5.8, 82, -5.8, 82, -8.4, 60, -10.6, 36), true, 0.4)
    .fill(lin([[0, o.boots[1]], [0.6, o.boots[0]], [0.8, '#5c4a42'], [1, o.boots[1]]], 0, 0, 1, 0))
    .stroke({ width: 1, color: '#070505', join: 'round' });
  strip(g, P(-9.6, 21, 0, 22.5, 9.2, 21), [3, 3, 3]).fill(o.bootTrim);
  // lacing / straps
  for (let i = 0; i < 3; i++) {
    const y = 34 + i * 14;
    g.moveTo(-8.6 + i * 0.6, y).lineTo(8 - i * 0.6, y + 3).stroke({ width: 1.1, color: o.bootTrim, alpha: 0.7 });
  }
  g.ellipse(4, 45, 1.6, 12).fill({ color: '#ffffff', alpha: 0.08 });
}

export function drawFoot(g: Graphics, o: OutfitDef): void {
  spline(g, P(-6, -2, 5.8, -3, 12, 1, 20, 4.5, 22.5, 8, 21, 9.5, -7.5, 9.5, -8.5, 4), true, 0.4)
    .fill(lin([[0, '#5c4a42'], [0.4, o.boots[0]], [1, o.boots[1]]], 0, 0, 0, 1))
    .stroke({ width: 1, color: '#070505', join: 'round' });
  g.moveTo(-8, 9.5).lineTo(21.6, 9.5).stroke({ width: 1.8, color: '#0b0807' });
  g.moveTo(6, -1.4).quadraticCurveTo(12, 2.5, 17, 4).stroke({ width: 0.7, color: o.bootTrim, alpha: 0.6 });
}

export function drawUpperArm(g: Graphics, o: OutfitDef): void {
  // sleeve tube over the upper arm
  limb(g, 58, 19, 17, 15, 1.5, 1, 0.3)
    .fill(lin([[0, o.robe[2]], [0.5, o.robe[1]], [0.9, o.robe[0]], [1, o.robe[1]]], 0, 0, 1, 0))
    .stroke({ width: 1, color: o.robeLine, join: 'round' });
  for (const f of [P(-3, 12, -1, 30, -3, 50), P(4, 22, 5, 40, 3, 54)]) spline(g, f).stroke({ width: 0.7, color: o.robe[2], alpha: 0.65, cap: 'round' });
  if (o.pauldron) {
    for (let i = 2; i >= 0; i--) {
      const y = i * 7;
      spline(g, P(-11 - i, y - 4, 0, y - 9, 11 + i, y - 4, 12 + i, y + 6, 0, y + 9, -12 - i, y + 6), true)
        .fill(lin([[0, o.robe[0]], [0.5, o.robe[1]], [1, o.robe[2]]]))
        .stroke({ width: 0.9, color: o.robeLine });
      g.moveTo(-12 - i, y + 6).quadraticCurveTo(0, y + 10.5, 12 + i, y + 6).stroke({ width: 1.4, color: o.trim });
    }
    g.circle(0, -2, 2).fill(o.trimLight).stroke({ width: 0.5, color: o.robeLine });
  }
}

export function drawForearm(g: Graphics, o: OutfitDef): void {
  if (o.bracers) {
    limb(g, 50, 15, 14, 12, 1, 0.5, 0.35)
      .fill(lin([[0, o.robe[2]], [0.6, o.robe[1]], [1, o.robe[2]]], 0, 0, 1, 0))
      .stroke({ width: 1, color: o.robeLine });
    spline(g, P(-7.4, 18, 7.4, 18, 6.8, 49, -6.4, 49), true, 0.2)
      .fill(lin([[0, o.boots[1]], [0.65, o.boots[0]], [1, o.boots[1]]], 0, 0, 1, 0))
      .stroke({ width: 0.9, color: '#070505' });
    for (let i = 0; i < 3; i++) g.moveTo(-7, 24 + i * 9).lineTo(6.8, 26 + i * 9).stroke({ width: 1.2, color: o.bootTrim, alpha: 0.8 });
  } else {
    limb(g, 50, 15, 15.5, 17, 1, 1, 0.5)
      .fill(lin([[0, o.robe[2]], [0.5, o.robe[1]], [0.9, o.robe[0]], [1, o.robe[1]]], 0, 0, 1, 0))
      .stroke({ width: 1, color: o.robeLine, join: 'round' });
    strip(g, P(-8.6, 46, 0, 48, 8.6, 46), [3.6, 3.6, 3.6]).fill(o.trim);
  }
}

/** Fist (sword hand) in hand-bone space; grip axis passes through (0,9) along x. */
export function drawFist(g: Graphics): void {
  spline(g, P(-5.6, 0, 5.4, 0, 7.2, 6, 7, 13.5, 2, 16.5, -4.5, 15.5, -7.2, 10, -6.8, 3), true, 0.4)
    .fill(lin([[0, SKIN.mid], [0.6, SKIN.base], [1, SKIN.light]], 0, 0, 1, 0))
    .stroke({ width: 0.9, color: SKIN.line, alpha: 0.85, join: 'round' });
  // curled fingers
  for (let i = 0; i < 3; i++) {
    const y = 6.6 + i * 3.1;
    g.moveTo(0.5, y).quadraticCurveTo(5, y - 0.6, 7, y + 0.9).stroke({ width: 0.6, color: SKIN.deep, alpha: 0.7, cap: 'round' });
  }
  // thumb wrapped over
  spline(g, P(-5.5, 4, -1, 6.5, 3.5, 7.5, 4.5, 9.3, 0, 9.6, -5.8, 8)).stroke({ width: 0.8, color: SKIN.line, alpha: 0.7, cap: 'round' });
  g.ellipse(3.5, 2.6, 2, 1.2).fill({ color: '#ffffff', alpha: 0.3 });
}

/** Open hand (off hand) with two fingers extended in a sword-finger gesture (劍指). */
export function drawOpenHand(g: Graphics): void {
  spline(g, P(-5.4, 0, 5, 0, 6.4, 6, 6.2, 11, 3.6, 13, -4, 12.6, -6.4, 7), true, 0.4)
    .fill(lin([[0, SKIN.mid], [0.6, SKIN.base], [1, SKIN.light]], 0, 0, 1, 0))
    .stroke({ width: 0.9, color: SKIN.line, alpha: 0.85, join: 'round' });
  // extended index + middle
  strip(g, P(2.5, 11, 3.2, 17, 3.4, 22.5), [4.6, 4, 3]).fill(lin([[0, SKIN.base], [1, SKIN.light]], 0, 0, 1, 0)).stroke({ width: 0.8, color: SKIN.line, alpha: 0.85 });
  g.moveTo(3.1, 13).lineTo(3.3, 21.5).stroke({ width: 0.4, color: SKIN.deep, alpha: 0.6 });
  // curled ring/little fingers + thumb
  spline(g, P(-3.6, 12, -2.2, 15, 0.4, 14.2)).stroke({ width: 1.6, color: SKIN.mid, cap: 'round' });
  spline(g, P(-5.4, 5, -6.8, 9.5, -4.6, 13)).stroke({ width: 0.7, color: SKIN.line, alpha: 0.6, cap: 'round' });
}

/** Sword in sword-bone space: +y is the blade direction, guard at y=0, pommel at y≈-17. */
export function drawSword(g: Graphics, w: WeaponDef): void {
  const L = w.bladeLen;
  const W = w.bladeWidth;
  // grip with cord wrap
  g.roundRect(-2.4, -15, 4.8, 13, 1.6).fill(lin([[0, w.grip[1]], [0.5, w.grip[0]], [1, w.grip[1]]], 0, 0, 1, 0));
  for (let y = -14; y < -3; y += 2.2) g.moveTo(-2.4, y).lineTo(2.4, y + 1.6).stroke({ width: 0.6, color: w.grip[1] });
  // pommel
  g.ellipse(0, -16.5, 3, 2.4).fill(lin([[0, w.guard[0]], [1, w.guard[1]]])).stroke({ width: 0.6, color: '#1a1a1a', alpha: 0.7 });
  // blade
  const blade = P(-W / 2, 3, -W / 2, L * 0.55, -W * 0.42, L * 0.92, 0, L, W * 0.42, L * 0.92, W / 2, L * 0.55, W / 2, 3);
  g.poly(blade.flatMap((p) => [p.x, p.y]), true).fill(lin([[0, w.blade[0]], [0.48, w.blade[1]], [0.52, w.blade[2]], [1, w.blade[1]]], 0, 0, 1, 0)).stroke({ width: 0.7, color: '#2a3038', alpha: 0.75, join: 'miter' });
  g.moveTo(0, 4).lineTo(0, L * 0.97).stroke({ width: 0.5, color: '#ffffff', alpha: 0.7 });
  g.moveTo(-W / 2 + 0.5, 6).lineTo(-W * 0.38, L * 0.9).stroke({ width: 0.5, color: '#ffffff', alpha: 0.9 });
  // fuller
  g.moveTo(-0.9, 8).lineTo(-0.9, L * 0.45).stroke({ width: 0.8, color: w.blade[2], alpha: 0.4 });
  // guard
  if (w.guardStyle === 'cloud') {
    spline(g, P(-9, 1, -7, -3.6, -2, -2, 0, -4, 2, -2, 7, -3.6, 9, 1, 4, 3.4, 0, 2.4, -4, 3.4), true).fill(lin([[0, w.guard[0]], [1, w.guard[1]]])).stroke({ width: 0.6, color: '#1a2020' });
  } else if (w.guardStyle === 'beast') {
    spline(g, P(-11, -1, -7, -5, -3, -2.5, 0, -5.5, 3, -2.5, 7, -5, 11, -1, 7, 3.6, 0, 4.2, -7, 3.6), true).fill(lin([[0, w.guard[0]], [1, w.guard[1]]])).stroke({ width: 0.6, color: '#3a2008' });
    g.circle(0, -0.5, 1.6).fill('#e84040').stroke({ width: 0.4, color: '#3a0808' });
  } else {
    spline(g, P(-10, -4, -5, 0.5, 0, 2.2, 5, 0.5, 10, -4, 6, 3.6, 0, 4.4, -6, 3.6), true).fill(lin([[0, w.guard[0]], [1, w.guard[1]]])).stroke({ width: 0.6, color: '#1a2a40' });
  }
}

/** Scabbard on the back hip (spine space). */
export function drawScabbard(g: Graphics, w: WeaponDef, o: OutfitDef): void {
  const L = w.bladeLen * 0.9;
  g.roundRect(-3.6, 0, 7.2, L, 3.4).fill(lin([[0, w.grip[1]], [0.5, w.grip[0]], [1, w.grip[1]]], 0, 0, 1, 0)).stroke({ width: 0.8, color: '#0a0a0a', alpha: 0.85 });
  g.roundRect(-4.2, -1, 8.4, 9, 2).fill(lin([[0, w.guard[0]], [1, w.guard[1]]])).stroke({ width: 0.5, color: '#1a1a1a' });
  g.roundRect(-4.2, L * 0.4, 8.4, 4, 1.4).fill(w.guard[1]);
  g.roundRect(-4, L - 9, 8, 9, 3.4).fill(lin([[0, w.guard[0]], [1, w.guard[1]]])).stroke({ width: 0.5, color: '#1a1a1a' });
  g.moveTo(1.4, 10).lineTo(1.4, L - 12).stroke({ width: 0.6, color: '#ffffff', alpha: 0.2 });
  void o;
}
