import { keyClip, procClip, type Clip } from '../engine/animation';

/**
 * Rotation convention (degrees): limbs hang along +y; positive = clockwise.
 * For a character facing +x: arms/legs  negative = swing forward, positive = backward;
 * spine/chest/head  positive = lean/nod forward.
 * `swordWorld` is the blade's world angle: 0 down, -90 / 270 forward, 180 up, 90 back.
 */

const TAU = Math.PI * 2;
const s = Math.sin;
const c = Math.cos;

const idle = procClip('idle', 3.4, (t, set) => {
  const p = (t / 3.4) * TAU;
  const b = s(p);
  set('root', 0, 0, 4 + b * 1.2);
  set('spine', 3 + b * 0.8);
  set('chest', -2 - b * 0.6);
  set('neck', 2);
  set('head', 2 + s(p + 0.6) * 1.2);
  set('upperArmF', -12 + b * 1.5);
  set('forearmF', -40 + b * 2);
  set('handF', 20);
  set('swordWorld', -70 + b * 2);
  set('upperArmB', 16 - b * 1.5);
  set('forearmB', -58 + b * 2);
  set('handB', -12);
  set('thighF', -15);
  set('shinF', 12);
  set('footF', 3);
  set('thighB', 14);
  set('shinB', 7);
  set('footB', -21);
});

const RUN_T = 0.62;
const run = procClip('run', RUN_T, (t, set) => {
  const p = (t / RUN_T) * TAU;
  const leg = (ph: number) => {
    const th = -14 - 42 * s(ph);
    // knee folds most while the leg swings forward
    const sw = Math.max(0, c(ph - 0.35));
    const knee = 12 + 92 * sw * sw + 10 * Math.max(0, -s(ph));
    const foot = -12 + 30 * Math.max(0, s(ph)) - 20 * sw;
    return [th, knee, foot];
  };
  const [tf, kf, ff] = leg(p);
  const [tb, kb, fb] = leg(p + Math.PI);
  const bob = -Math.abs(c(p)) * 7;
  set('root', 0, 0, 10 + bob, 1, 1);
  set('spine', 16 + s(2 * p) * 1.5);
  set('chest', -3 + s(p) * 3);
  set('neck', -6);
  set('head', -4 + s(2 * p) * 1.5);
  set('thighF', tf);
  set('shinF', kf);
  set('footF', ff);
  set('thighB', tb);
  set('shinB', kb);
  set('footB', fb);
  // sword arm trails behind, blade pointing back
  set('upperArmF', 34 + s(p) * 10);
  set('forearmF', -30 - s(p) * 8);
  set('handF', 10);
  set('swordWorld', 70 + s(p) * 4);
  // off hand pumps opposite to the front leg
  set('upperArmB', -26 - s(p + Math.PI) * 34);
  set('forearmB', -70 - Math.max(0, s(p + Math.PI)) * 22);
  set('handB', -12);
});

// 1: overhead diagonal slash
const attack1 = keyClip(
  'attack1',
  0.46,
  {
    root: { x: [[0, 0], [0.12, -6], [0.22, 14, 'snap'], [0.46, 8]], y: [[0, 4], [0.12, 2], [0.22, 12, 'snap'], [0.46, 8]] },
    spine: { rot: [[0, 3], [0.12, -12], [0.22, 18, 'snap'], [0.46, 10]] },
    chest: { rot: [[0, -2], [0.12, -8], [0.22, 6, 'snap'], [0.46, 2]] },
    head: { rot: [[0, 2], [0.12, 8], [0.22, -10, 'snap'], [0.46, -4]] },
    upperArmF: { rot: [[0, -12], [0.12, 150, 'out'], [0.22, -92, 'snap'], [0.3, -70], [0.46, -42]] },
    forearmF: { rot: [[0, -40], [0.12, -40], [0.22, -6, 'snap'], [0.46, -28]] },
    handF: { rot: [[0, 20], [0.12, 10], [0.22, 0], [0.46, 10]] },
    swordWorld: { rot: [[0, -70], [0.12, 125, 'out'], [0.22, 295, 'snap'], [0.3, 318], [0.46, 300]] },
    upperArmB: { rot: [[0, 16], [0.12, -40], [0.22, 60, 'snap'], [0.46, 40]] },
    forearmB: { rot: [[0, -58], [0.12, -60], [0.22, -24, 'snap'], [0.46, -40]] },
    handB: { rot: [[0, -12]] },
    thighF: { rot: [[0, -15], [0.12, -8], [0.22, -48, 'snap'], [0.46, -42]] },
    shinF: { rot: [[0, 12], [0.12, 16], [0.22, 46, 'snap'], [0.46, 42]] },
    footF: { rot: [[0, 3], [0.22, 2], [0.46, 0]] },
    thighB: { rot: [[0, 14], [0.22, 32, 'snap'], [0.46, 28]] },
    shinB: { rot: [[0, 7], [0.22, 12], [0.46, 12]] },
    footB: { rot: [[0, -21], [0.22, -44, 'snap'], [0.46, -40]] },
  },
  { events: [{ t: 0.13, name: 'trailOn' }, { t: 0.1, name: 'fierce' }, { t: 0.2, name: 'hit' }, { t: 0.29, name: 'trailOff' }] },
);

// 2: rising slash, low-back to high-front
const attack2 = keyClip(
  'attack2',
  0.46,
  {
    root: { x: [[0, 8], [0.12, 4], [0.24, 20, 'snap'], [0.46, 12]], y: [[0, 8], [0.12, 16], [0.24, -2, 'snap'], [0.46, 6]] },
    spine: { rot: [[0, 10], [0.12, 24], [0.24, -10, 'snap'], [0.46, 2]] },
    chest: { rot: [[0, 2], [0.12, 8], [0.24, -8, 'snap'], [0.46, -2]] },
    head: { rot: [[0, -4], [0.12, -6], [0.24, -12, 'snap'], [0.46, -2]] },
    upperArmF: { rot: [[0, -42], [0.12, 50, 'out'], [0.24, -158, 'snap'], [0.32, -168], [0.46, -132]] },
    forearmF: { rot: [[0, -28], [0.12, -12], [0.24, -6, 'snap'], [0.46, -26]] },
    handF: { rot: [[0, 10], [0.12, 0], [0.24, 0], [0.46, 10]] },
    swordWorld: { rot: [[0, 300], [0.12, 385, 'out'], [0.24, 205, 'snap'], [0.32, 190], [0.46, 210]] },
    upperArmB: { rot: [[0, 40], [0.12, -30], [0.24, 64, 'snap'], [0.46, 40]] },
    forearmB: { rot: [[0, -40], [0.12, -64], [0.24, -20, 'snap'], [0.46, -40]] },
    handB: { rot: [[0, -12]] },
    thighF: { rot: [[0, -42], [0.12, -54], [0.24, -22, 'snap'], [0.46, -30]] },
    shinF: { rot: [[0, 42], [0.12, 72], [0.24, 16, 'snap'], [0.46, 26]] },
    footF: { rot: [[0, 0], [0.12, -10], [0.24, 6], [0.46, 4]] },
    thighB: { rot: [[0, 28], [0.12, 20], [0.24, 24], [0.46, 20]] },
    shinB: { rot: [[0, 12], [0.12, 42], [0.24, 6, 'snap'], [0.46, 10]] },
    footB: { rot: [[0, -40], [0.12, -50], [0.24, -30], [0.46, -30]] },
  },
  { events: [{ t: 0.13, name: 'trailOn' }, { t: 0.1, name: 'fierce' }, { t: 0.22, name: 'hit' }, { t: 0.31, name: 'trailOff' }] },
);

// 3: leaping overhead cleave
const attack3 = keyClip(
  'attack3',
  0.76,
  {
    root: { x: [[0, 12], [0.18, 6], [0.34, 36, 'out'], [0.52, 32], [0.76, 0, 'inout']], y: [[0, 6], [0.1, 16], [0.24, -30, 'out'], [0.34, 24, 'in'], [0.52, 22], [0.76, 4]] },
    spine: { rot: [[0, 2], [0.18, -18], [0.34, 34, 'snap'], [0.52, 30], [0.76, 3]] },
    chest: { rot: [[0, -2], [0.18, -10], [0.34, 10, 'snap'], [0.76, -2]] },
    head: { rot: [[0, -2], [0.18, 6], [0.34, -20, 'snap'], [0.52, -16], [0.76, 2]] },
    upperArmF: { rot: [[0, -132], [0.18, -205, 'out'], [0.34, -46, 'snap'], [0.52, -36], [0.76, -12]] },
    forearmF: { rot: [[0, -26], [0.18, -36], [0.34, -6, 'snap'], [0.76, -40]] },
    handF: { rot: [[0, 10], [0.18, 10], [0.34, 0, 'snap'], [0.76, 20]] },
    swordWorld: { rot: [[0, 210], [0.18, 118, 'out'], [0.34, 318, 'snap'], [0.52, 330], [0.76, 290]] },
    upperArmB: { rot: [[0, 40], [0.18, -150], [0.34, 70, 'snap'], [0.76, 16]] },
    forearmB: { rot: [[0, -40], [0.18, -20], [0.34, -40], [0.76, -58]] },
    handB: { rot: [[0, -12]] },
    thighF: { rot: [[0, -30], [0.18, -20], [0.28, -82], [0.34, -64, 'snap'], [0.52, -62], [0.76, -15]] },
    shinF: { rot: [[0, 26], [0.18, 40], [0.28, 104], [0.34, 72, 'snap'], [0.52, 68], [0.76, 12]] },
    footF: { rot: [[0, 4], [0.28, -10], [0.34, 0], [0.76, 3]] },
    thighB: { rot: [[0, 20], [0.18, 24], [0.28, 8], [0.34, 42, 'snap'], [0.52, 44], [0.76, 14]] },
    shinB: { rot: [[0, 10], [0.18, 40], [0.28, 92], [0.34, 72, 'snap'], [0.52, 74], [0.76, 7]] },
    footB: { rot: [[0, -30], [0.28, -10], [0.34, -50, 'snap'], [0.52, -50], [0.76, -21]] },
  },
  { events: [{ t: 0.2, name: 'trailOn' }, { t: 0.14, name: 'fierce' }, { t: 0.33, name: 'hit' }, { t: 0.33, name: 'heavy' }, { t: 0.44, name: 'trailOff' }] },
);

const hurt = keyClip('hurt', 0.55, {
  root: { x: [[0, 0], [0.08, -16, 'snap'], [0.55, 0, 'inout']], y: [[0, 4], [0.08, 10, 'snap'], [0.55, 4]] },
  spine: { rot: [[0, 3], [0.08, -20, 'snap'], [0.24, -12], [0.55, 3]] },
  chest: { rot: [[0, -2], [0.08, -10, 'snap'], [0.55, -2]] },
  neck: { rot: [[0, 2], [0.08, -12, 'snap'], [0.55, 2]] },
  head: { rot: [[0, 2], [0.08, -16, 'snap'], [0.3, -8], [0.55, 2]] },
  upperArmF: { rot: [[0, -12], [0.08, 30, 'snap'], [0.55, -12]] },
  forearmF: { rot: [[0, -40], [0.08, -70, 'snap'], [0.55, -40]] },
  handF: { rot: [[0, 20]] },
  swordWorld: { rot: [[0, -70], [0.08, -20, 'snap'], [0.55, -70]] },
  upperArmB: { rot: [[0, 16], [0.08, -40, 'snap'], [0.55, 16]] },
  forearmB: { rot: [[0, -58], [0.08, -30, 'snap'], [0.55, -58]] },
  handB: { rot: [[0, -12]] },
  thighF: { rot: [[0, -15], [0.08, -30, 'snap'], [0.55, -15]] },
  shinF: { rot: [[0, 12], [0.08, 30, 'snap'], [0.55, 12]] },
  footF: { rot: [[0, 3], [0.08, 0], [0.55, 3]] },
  thighB: { rot: [[0, 14], [0.08, 4, 'snap'], [0.55, 14]] },
  shinB: { rot: [[0, 7], [0.08, 24, 'snap'], [0.55, 7]] },
  footB: { rot: [[0, -21], [0.08, -26], [0.55, -21]] },
});

export const CLIPS = { idle, run, attack1, attack2, attack3, hurt } satisfies Record<string, Clip>;
export type ClipName = keyof typeof CLIPS;
