import { Container, Graphics } from 'pixi.js';
import { lin, P, rad, spline, strip } from '../engine/draw';
import type { HeadgearDef } from './equipment';
import { EYE, HAIR, SKIN } from './palette';

/**
 * Head drawn in head-bone space: origin at the top of the neck, facing +x, 3/4 view.
 * Crown ≈ y-57, chin ≈ y+2.
 */

export type Expression = 'normal' | 'blink' | 'fierce' | 'hurt';

export const PONYTAIL_ROOT = { x: -24, y: -49 };
export const SIDELOCK_ROOT = { x: -2.5, y: -33 };

const FACE = P(
  -2, -56,
  10, -52.5,
  17.2, -45.5,
  20.6, -35.5,
  19.7, -28.6,
  21.1, -22.6,
  23.3, -17.2,
  22.6, -15.3,
  20.3, -14.1,
  20.9, -11.8,
  20.0, -10.1,
  20.5, -8.9,
  19.0, -6.5,
  19.3, -3.8,
  17.4, -0.8,
  13.2, 0.8,
  5, -2.2,
  -3.5, -8,
  -8, -14.5,
  -14, -23,
  -26, -29,
  -25, -46,
  -14, -55,
);

function drawBackHair(g: Graphics): void {
  // mass behind the skull and the nape
  spline(g, P(-6, -58, -22, -54, -31, -40, -29.5, -27, -23, -17, -16, -10, -10, -9, -7, -14, -10, -22, -4, -36), true)
    .fill(lin([[0, HAIR.mid], [0.5, HAIR.base], [1, HAIR.dark]], 0, 0, 0.3, 1));
}

function drawEar(g: Graphics): void {
  const ox = -10.5;
  const oy = -20.5;
  spline(g, P(ox + 1, oy - 7.5, ox - 3.4, oy - 6, ox - 4.6, oy - 1, ox - 3.2, oy + 4.6, ox - 0.6, oy + 7.5, ox + 2.6, oy + 6.6, ox + 3.2, oy + 1, ox + 3, oy - 5), true)
    .fill(lin([[0, SKIN.mid], [1, SKIN.shade]], 0, 0, 1, 0))
    .stroke({ width: 0.7, color: SKIN.line, alpha: 0.75 });
  spline(g, P(ox - 0.2, oy - 4.6, ox - 2.4, oy - 2.6, ox - 2.2, oy + 2, ox - 0.4, oy + 4.6, ox + 1.2, oy + 3.6))
    .stroke({ width: 0.8, color: SKIN.deep, alpha: 0.6, cap: 'round' });
  // small jade earring
  g.circle(ox + 0.2, oy + 9.6, 1.1).fill('#9fe3c3').stroke({ width: 0.4, color: '#2e6b55' });
  g.moveTo(ox + 0.2, oy + 7.3).lineTo(ox + 0.2, oy + 8.6).stroke({ width: 0.45, color: '#c9a65a' });
}

function drawFace(g: Graphics): void {
  spline(g, FACE, true, 0.42)
    .fill(lin([[0, SKIN.shade], [0.42, SKIN.base], [0.85, SKIN.light], [1, SKIN.base]], 0, 0.3, 1, 0.3))
    .stroke({ width: 0.7, color: SKIN.line, alpha: 0.75, join: 'round' });
  // soft shadow under the hairline
  spline(g, P(-2, -49, 8, -48, 17, -44.5, 20.4, -37, 18.5, -39, 12, -42.5, 4, -44, -4, -43), true).fill({ color: SKIN.shade, alpha: 0.45 });
  // rim light along the profile
  spline(g, P(20.2, -34, 19.4, -28.6, 20.6, -22.8, 22.6, -17.6)).stroke({ width: 0.8, color: '#fff8ee', alpha: 0.7, cap: 'round' });
  spline(g, P(18.6, -6, 18.8, -3.4, 17.2, -0.6)).stroke({ width: 0.7, color: '#fff8ee', alpha: 0.6, cap: 'round' });

  // jaw / under-cheek form shadow
  spline(g, P(-9, -12, -4, -7, 4, -2.2, 11, -0.6, 4, -4.4, -2, -9.5, -5, -16), false)
    .closePath()
    .fill({ color: SKIN.shade, alpha: 0.35 });
  // cheek bone soft shade along the back of the cheek
  g.ellipse(-1, -16, 6, 9).fill({ fill: rad([[0, SKIN.shade], [1, '#00000000']]), alpha: 0.45 });
  // blush
  g.ellipse(12.5, -15.5, 6.8, 3.6).fill({ fill: rad([[0, SKIN.blush], [1, '#f2897f00']]), alpha: 0.55 });
  g.ellipse(20.3, -16.6, 1.6, 1.4).fill({ fill: rad([[0, SKIN.blush], [1, '#f2897f00']]), alpha: 0.35 });

  // nose: bridge shade, tip light, nostril
  spline(g, P(15.6, -27, 17.6, -21.5, 19.4, -17.6, 18.2, -16.2, 16.6, -21.6))
    .closePath()
    .fill({ color: SKIN.shade, alpha: 0.35 });
  g.ellipse(21.6, -17.6, 1.3, 0.9).fill({ color: '#ffffff', alpha: 0.55 });
  spline(g, P(18.4, -15.1, 19.5, -14.4, 20.6, -14.6)).stroke({ width: 0.75, color: SKIN.deep, cap: 'round' });

  // lips
  spline(g, P(20.9, -11.8, 19.4, -11.4, 17.9, -10.9, 16.7, -10.3, 18.4, -10.25, 20.1, -10.1), true)
    .fill(lin([[0, SKIN.lipDark], [1, SKIN.lip]], 0, 0, 0, 1));
  spline(g, P(16.8, -10.2, 18.6, -9.3, 20.4, -8.8, 20.3, -9.9, 18.4, -10.1), true)
    .fill(lin([[0, SKIN.lip], [1, SKIN.lipLight]], 0, 0, 0, 1));
  g.ellipse(19.3, -9.35, 0.8, 0.3).fill({ color: '#ffffff', alpha: 0.6 });
  spline(g, P(16.3, -10.35, 17.6, -10.25, 18.9, -10.2, 20.1, -10.05)).stroke({ width: 0.6, color: SKIN.lipDark, cap: 'round' });
  g.circle(16.2, -10.3, 0.45).fill({ color: SKIN.deep, alpha: 0.6 });
  // chin highlight
  g.ellipse(17.3, -4.2, 1.6, 1.1).fill({ color: '#ffffff', alpha: 0.22 });
}

function eyeShape(g: Graphics): Graphics {
  return g.moveTo(3, -24.6).bezierCurveTo(5, -27.9, 10.5, -29.2, 13.6, -25.5).bezierCurveTo(11.2, -22.6, 6, -22.1, 3, -24.6).closePath();
}

function drawEyesOpen(c: Container, mood: 'normal' | 'fierce'): void {
  const g = new Graphics();
  c.addChild(g);
  // socket shade
  g.ellipse(8, -26.5, 8.5, 4.6).fill({ fill: rad([[0, SKIN.shade], [1, '#d9a08800']]), alpha: 0.45 });
  // eye white
  eyeShape(g).fill(lin([[0, EYE.whiteShade], [0.45, EYE.white], [1, EYE.white]]));

  // iris (masked by the eye white)
  const iris = new Graphics();
  const ix = mood === 'fierce' ? 9.6 : 9.0;
  iris.ellipse(ix, -25.5, 3.0, 3.4).fill(lin([[0, EYE.irisTop], [0.45, EYE.irisMid], [1, EYE.irisLow]]));
  iris.ellipse(ix, -25.5, 3.0, 3.4).stroke({ width: 0.5, color: EYE.irisRim });
  iris.ellipse(ix + 0.2, -25.3, 1.35, 1.75).fill(EYE.pupil);
  // iris fibres
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    iris.moveTo(ix + Math.cos(a) * 1.6, -25.4 + Math.sin(a) * 1.9).lineTo(ix + Math.cos(a) * 2.6, -25.4 + Math.sin(a) * 3);
  }
  iris.stroke({ width: 0.25, color: '#d8a060', alpha: 0.45 });
  // upper lid shadow on the eyeball
  iris.moveTo(2, -26).bezierCurveTo(6, -30, 11, -30, 14, -26).lineTo(14, -24.2).bezierCurveTo(10, -27.2, 6, -27.2, 2, -24.2).closePath().fill({ color: '#3a2222', alpha: 0.3 });
  iris.circle(ix + 1.2, -26.9, 0.95).fill('#ffffff');
  iris.circle(ix - 1.0, -24.0, 0.45).fill({ color: '#ffffff', alpha: 0.85 });
  const mask = new Graphics();
  eyeShape(mask).fill('#fff');
  iris.mask = mask;
  c.addChild(iris, mask);

  const l = new Graphics();
  c.addChild(l);
  // lower lid & crease
  spline(l, P(4.2, -23.6, 8, -22.5, 12, -23.3)).stroke({ width: 0.55, color: SKIN.deep, alpha: 0.6, cap: 'round' });
  spline(l, P(4.6, -28.5, 8.4, -30.6, 12.6, -28.8)).stroke({ width: 0.5, color: SKIN.deep, alpha: 0.55, cap: 'round' });
  // upper lash line with outer wing
  strip(l, P(0.4, -26.9, 3, -25.2, 5.6, -27.8, 9.2, -29.0, 12.2, -27.7, 13.8, -25.6), [0.5, 1.3, 1.6, 1.4, 1.0, 0.4]).fill(EYE.lash);
  // lashes
  l.moveTo(3.1, -25.6).quadraticCurveTo(1.6, -26.6, 0.6, -28.4);
  l.moveTo(4.4, -26.8).quadraticCurveTo(3.2, -28.2, 2.6, -29.6);
  l.moveTo(6, -27.9).quadraticCurveTo(5.4, -29.4, 5.2, -30.4);
  l.stroke({ width: 0.55, color: EYE.lash, cap: 'round' });
  l.moveTo(4.5, -23.4).lineTo(4.0, -22.5).moveTo(6.2, -22.9).lineTo(6.0, -22.0).stroke({ width: 0.3, color: EYE.lash, alpha: 0.6 });

  // far eye (mostly hidden behind the bridge)
  l.moveTo(16.7, -25.4).bezierCurveTo(17.4, -26.6, 18.8, -26.8, 19.6, -26.0).bezierCurveTo(18.8, -24.6, 17.6, -24.6, 16.7, -25.4).fill(EYE.white);
  l.ellipse(18.4, -25.6, 0.95, 1.35).fill(EYE.irisMid);
  l.circle(18.6, -26.1, 0.35).fill('#ffffff');
  strip(l, P(16.4, -26.0, 17.8, -27.0, 19.4, -26.7, 20.6, -27.6), [0.4, 1.0, 1.0, 0.35]).fill(EYE.lash);

  // brows
  const by = mood === 'fierce' ? 1.2 : 0;
  strip(l, P(14.2, -31.4 + by, 10.6, -33.0 + by * 0.4, 6.2, -33.4, 1.4, -32.2), [1.35, 1.25, 0.9, 0.35]).fill({ color: HAIR.base, alpha: 0.92 });
  strip(l, P(17.2, -32.4 + by, 19.0, -32.6, 20.6, -31.9), [0.9, 0.8, 0.3]).fill({ color: HAIR.base, alpha: 0.85 });
}

function drawEyesClosed(c: Container, hurt: boolean): void {
  const g = new Graphics();
  c.addChild(g);
  g.ellipse(8, -26.5, 8.5, 4.6).fill({ fill: rad([[0, SKIN.shade], [1, '#d9a08800']]), alpha: 0.45 });
  if (hurt) {
    // squeezed ">" shaped lids
    strip(g, P(13.4, -26.6, 9, -25.2, 3.4, -24.0), [1.3, 1.2, 0.5]).fill(EYE.lash);
    strip(g, P(13.0, -24.4, 9, -24.6, 4.6, -22.8), [0.6, 0.8, 0.3]).fill({ color: EYE.lash, alpha: 0.7 });
    strip(g, P(17.0, -26.2, 19.0, -25.6, 20.4, -26.2), [0.9, 0.8, 0.3]).fill(EYE.lash);
    strip(g, P(14.2, -30.2, 10.6, -31.6, 6.2, -33.0, 1.4, -33.0), [1.35, 1.25, 0.9, 0.35]).fill({ color: HAIR.base, alpha: 0.92 });
    strip(g, P(17.2, -31.0, 19.0, -32.0, 20.6, -32.4), [0.9, 0.8, 0.3]).fill({ color: HAIR.base, alpha: 0.85 });
  } else {
    strip(g, P(0.6, -25.6, 3.2, -24.2, 8.4, -23.4, 13.6, -25.2), [0.4, 1.2, 1.4, 0.5]).fill(EYE.lash);
    g.moveTo(3.2, -24.0).quadraticCurveTo(1.6, -23.6, 0.6, -22.4).moveTo(4.8, -23.5).quadraticCurveTo(3.8, -22.6, 3.4, -21.5).stroke({ width: 0.5, color: EYE.lash, cap: 'round' });
    strip(g, P(16.6, -25.0, 18.4, -24.6, 20.4, -25.4), [0.5, 0.9, 0.3]).fill(EYE.lash);
    strip(g, P(14.2, -31.4, 10.6, -33.0, 6.2, -33.4, 1.4, -32.2), [1.35, 1.25, 0.9, 0.35]).fill({ color: HAIR.base, alpha: 0.92 });
    strip(g, P(17.2, -32.4, 19.0, -32.6, 20.6, -31.9), [0.9, 0.8, 0.3]).fill({ color: HAIR.base, alpha: 0.85 });
  }
}

function drawMouthOpen(g: Graphics, wide: number): void {
  // open mouth replaces the closed line (shout / pain)
  spline(g, P(16.2, -10.6, 18.4, -11.2, 20.4, -11.0, 20.6, -10.2 + wide * 0.4, 19.6, -8.4 + wide, 17.6, -8.8 + wide * 0.6), true)
    .fill('#5a1f24')
    .stroke({ width: 0.5, color: SKIN.lipDark });
  g.moveTo(17, -10.6).lineTo(20.2, -10.8).lineTo(20.2, -10.2).lineTo(17.2, -10.1).closePath().fill({ color: '#ffffff', alpha: 0.9 });
}

function drawHairTop(g: Graphics): void {
  // swept-back cap over the skull
  const cap = P(-4, -30, 1, -40, 8, -47, 16.5, -48.5, 19.5, -45, 14, -55, 4, -59.5, -10, -59, -23, -53.5, -30.5, -42, -29.5, -30, -24, -24.5, -17, -25, -11, -28.5);
  spline(g, cap, true, 0.45)
    .fill(lin([[0, HAIR.light], [0.35, HAIR.mid], [0.75, HAIR.base], [1, HAIR.dark]], 0.6, 0, 0.2, 1))
    .stroke({ width: 0.8, color: HAIR.line, alpha: 0.9 });
  // sheen ring
  spline(g, P(-24, -47, -14, -55.5, 0, -57.5, 10, -54, 4, -55, -12, -52.5, -22, -45), true).fill({ color: HAIR.shine, alpha: 0.42 });
  // strand lines sweeping to the tie
  const lines = [
    P(-3, -32, -8, -38, -16, -44, -23, -48),
    P(2, -40, -4, -46, -14, -50, -23, -50),
    P(10, -47, 2, -52, -10, -54, -22, -51),
    P(-8, -29, -14, -33, -20, -40, -24, -47),
    P(14, -52, 4, -57, -10, -57.5, -20, -53),
  ];
  for (const l of lines) spline(g, l).stroke({ width: 0.55, color: HAIR.shine, alpha: 0.35, cap: 'round' });
  for (const l of lines) spline(g, l.map((p) => ({ x: p.x + 1.2, y: p.y + 1.4 }))).stroke({ width: 0.5, color: HAIR.line, alpha: 0.45, cap: 'round' });
  // temple strands over the ear
  spline(g, P(-3, -30, -8, -27, -13, -27, -18, -29), false).stroke({ width: 1.2, color: HAIR.base, cap: 'round' });

  // bangs: tapered side-swept locks over the forehead
  const locks: [number[], number, string][] = [
    [[-6, -54, 1, -49.5, 5.5, -43.5, 6, -37.5], 6, HAIR.base],
    [[-2, -56.5, 8, -52.5, 15, -46, 18.6, -39.5, 19.2, -34.5], 8, HAIR.base],
    [[3, -57.5, 12.5, -53.5, 19.6, -47.5, 22.4, -41.5], 6.6, HAIR.mid],
    [[6, -57, 13, -52, 16.2, -45.5, 15, -39.5], 5, HAIR.mid],
    [[0, -53, 6, -47, 10, -40.5, 10.4, -33.5], 2, HAIR.base],
    [[12, -57, 19, -53.5, 23.4, -48.5, 24.4, -44.5], 4, HAIR.base],
    [[-3, -55, 4, -50, 9.5, -44, 11.2, -38.5], 4.6, HAIR.mid],
  ];
  for (const [c, w, col] of locks) {
    const pts = P(...c);
    strip(g, pts, (t) => w * Math.min(1, 0.55 + t * 2) * (1 - t) ** 0.9 + 0.15)
      .fill(lin([[0, col], [0.6, HAIR.base], [1, HAIR.dark]]))
      .stroke({ width: 0.5, color: HAIR.line, alpha: 0.85, join: 'round' });
    spline(g, pts.slice(0, -1).map((p) => ({ x: p.x - 0.6, y: p.y - 0.4 }))).stroke({ width: 0.45, color: HAIR.shine, alpha: 0.4, cap: 'round' });
  }
}

function drawHeadgear(g: Graphics, hg: HeadgearDef): void {
  const { x, y } = PONYTAIL_ROOT;
  if (hg.kind === 'ribbon') {
    // band wrapped around the tie
    g.roundRect(x - 3.5, y - 6, 7, 12, 2.5).fill(lin([[0, hg.main[0]], [1, hg.main[1]]], 0, 0, 1, 0)).stroke({ width: 0.6, color: '#1b3f40' });
    // bow loops
    spline(g, P(x - 1, y - 2, x - 9, y - 11, x - 13, y - 6, x - 8, y - 1), true).fill(lin([[0, hg.main[0]], [1, hg.main[1]]])).stroke({ width: 0.6, color: '#1b3f40' });
    spline(g, P(x + 1, y - 3, x + 5, y - 13, x + 10, y - 10, x + 4, y - 2), true).fill(lin([[0, hg.main[0]], [1, hg.main[1]]])).stroke({ width: 0.6, color: '#1b3f40' });
    g.circle(x, y - 1.5, 2.4).fill(hg.main[1]).stroke({ width: 0.5, color: '#1b3f40' });
  } else if (hg.kind === 'jadepin') {
    // gold ring band + jade hairpin through the tie
    g.roundRect(x - 3.2, y - 6, 6.4, 12, 2).fill(lin([[0, '#f6dd94'], [1, '#9a7428']], 0, 0, 1, 0)).stroke({ width: 0.5, color: '#5a4012' });
    strip(g, P(x + 12, y - 12, x + 2, y - 4, x - 10, y + 5, x - 18, y + 11), [2.6, 2.4, 2.2, 1.4]).fill(lin([[0, hg.main[0]], [1, hg.main[1]]], 0, 0, 0, 1)).stroke({ width: 0.45, color: '#1f5a44' });
    g.circle(x + 13, y - 13, 3.2).fill(rad([[0, '#e6fff4'], [0.5, hg.main[0]], [1, hg.main[1]]], 0.4, 0.35, 0.6)).stroke({ width: 0.5, color: '#1f5a44' });
    // gold cap on the pin head
    g.moveTo(x + 10.5, y - 10.5).quadraticCurveTo(x + 13, y - 8.5, x + 15.5, y - 10.5).stroke({ width: 1, color: hg.accent });
  } else {
    // golden phoenix crown piece
    g.roundRect(x - 3.5, y - 6.5, 7, 13, 2).fill(lin([[0, '#fff0b8'], [1, '#a8781e']], 0, 0, 1, 0)).stroke({ width: 0.5, color: '#5a3c0a' });
    const body = P(x - 2, y - 7, x + 6, y - 14, x + 14, y - 15, x + 18, y - 19, x + 15, y - 12, x + 7, y - 7);
    spline(g, body, true).fill(lin([[0, hg.main[0]], [1, hg.main[1]]])).stroke({ width: 0.55, color: '#5a3c0a' });
    // tail feathers fanning back
    for (let i = 0; i < 4; i++) {
      const a = -2.2 - i * 0.28;
      const l = 14 + i * 2;
      spline(g, P(x - 1, y - 6, x - 1 + Math.cos(a) * l * 0.6, y - 6 + Math.sin(a) * l * 0.6 - 2, x - 1 + Math.cos(a) * l, y - 6 + Math.sin(a) * l), false).stroke({ width: 2.2 - i * 0.3, color: i % 2 ? hg.main[1] : hg.main[0], cap: 'round' });
    }
    g.circle(x + 15.5, y - 16.5, 0.8).fill(hg.accent);
    g.circle(x + 1, y - 2, 2).fill(rad([[0, '#ffb0a8'], [1, hg.accent]])).stroke({ width: 0.4, color: '#5a1010' });
  }
}

export interface HeadViews {
  root: Container;
  setExpression(e: Expression): void;
}

export function buildHead(hg: HeadgearDef): HeadViews {
  const root = new Container();
  const back = new Graphics();
  drawBackHair(back);
  const face = new Graphics();
  drawEar(face);
  drawFace(face);

  const exprs: Record<string, Container> = {};
  const eyesN = new Container();
  drawEyesOpen(eyesN, 'normal');
  const eyesF = new Container();
  drawEyesOpen(eyesF, 'fierce');
  const eyesB = new Container();
  drawEyesClosed(eyesB, false);
  const eyesH = new Container();
  drawEyesClosed(eyesH, true);
  const mouthF = new Graphics();
  drawMouthOpen(mouthF, 0.6);
  const mouthH = new Graphics();
  drawMouthOpen(mouthH, 1.4);
  exprs.normal = eyesN;
  exprs.fierce = eyesF;
  exprs.blink = eyesB;
  exprs.hurt = eyesH;

  const top = new Graphics();
  drawHairTop(top);
  const gear = new Graphics();
  drawHeadgear(gear, hg);

  root.addChild(back, face, eyesN, eyesF, eyesB, eyesH, mouthF, mouthH, top, gear);

  const setExpression = (e: Expression) => {
    for (const k in exprs) exprs[k].visible = k === e;
    mouthF.visible = e === 'fierce';
    mouthH.visible = e === 'hurt';
  };
  setExpression('normal');
  return { root, setExpression };
}
