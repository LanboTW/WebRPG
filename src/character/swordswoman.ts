import { Container, Graphics } from 'pixi.js';
import { Animator, type Clip } from '../engine/animation';
import { Chain } from '../engine/chain';
import { DEG, lin, rad, spline, strip, stripOutline, type Pt } from '../engine/draw';
import { Skeleton, Slot, type BoneDef } from '../engine/skeleton';
import {
  drawFist,
  drawFoot,
  drawForearm,
  drawHipSkirt,
  drawNeck,
  drawOpenHand,
  drawSash,
  drawScabbard,
  drawShin,
  drawSword,
  drawThigh,
  drawTorso,
  drawUpperArm,
} from './body';
import { CLIPS, type ClipName } from './clips';
import type { Loadout } from './equipment';
import { buildHead, PONYTAIL_ROOT, SIDELOCK_ROOT, type Expression, type HeadViews } from './head';
import { HAIR } from './palette';

const BONES: BoneDef[] = [
  { name: 'root', x: 0, y: -180 },
  { name: 'spine', parent: 'root', x: 0, y: -28 },
  { name: 'chest', parent: 'spine', x: 0, y: -2 },
  { name: 'neck', parent: 'chest', x: 3, y: -78 },
  { name: 'head', parent: 'neck', x: 1, y: -11 },
  { name: 'upperArmF', parent: 'chest', x: 6, y: -70 },
  { name: 'forearmF', parent: 'upperArmF', x: 0, y: 56 },
  { name: 'handF', parent: 'forearmF', x: 0, y: 49 },
  { name: 'sword', parent: 'handF', x: 0, y: 9, rot: -90 },
  { name: 'upperArmB', parent: 'chest', x: -6, y: -71 },
  { name: 'forearmB', parent: 'upperArmB', x: 0, y: 56 },
  { name: 'handB', parent: 'forearmB', x: 0, y: 49 },
  { name: 'thighF', parent: 'root', x: 4, y: 6 },
  { name: 'shinF', parent: 'thighF', x: 0, y: 86 },
  { name: 'footF', parent: 'shinF', x: 0, y: 80 },
  { name: 'thighB', parent: 'root', x: -4, y: 4 },
  { name: 'shinB', parent: 'thighB', x: 0, y: 86 },
  { name: 'footB', parent: 'shinB', x: 0, y: 80 },
  { name: 'scabbard', parent: 'spine', x: -8, y: 2, rot: 38 },
];

const BACK_TINT = 0xb4bccb;

interface Sleeve {
  wrist: Chain;
  elbow: Chain;
  g: Graphics;
  arm: 'F' | 'B';
}

export interface SwordTrailSample {
  base: Pt;
  tip: Pt;
  age: number;
}

export class Swordswoman {
  readonly view = new Container();
  readonly skel = new Skeleton(BONES);
  readonly anim = new Animator();
  loadout: Loadout;

  private slots: Slot[] = [];
  private staticGfx = new Map<string, Graphics>();
  private head!: HeadViews;
  private headSlot!: Slot;
  private shadow = new Graphics();

  private ponytail = new Chain({ segments: 9, length: [12, 14, 15, 15, 15, 14, 13, 12, 11], gravity: 700, damping: 0.95, stiffness: (i) => 0.2 - i * 0.017, drag: 1 });
  private sideLocks = [new Chain({ segments: 4, length: 7.5, gravity: 600, damping: 0.9, stiffness: 0.12, drag: 0.5 }), new Chain({ segments: 3, length: 7, gravity: 600, damping: 0.9, stiffness: 0.12, drag: 0.5 })];
  private hairTails = [new Chain({ segments: 6, length: 7.5, gravity: 650, damping: 0.94, stiffness: 0.05, drag: 1.4 }), new Chain({ segments: 5, length: 7.5, gravity: 650, damping: 0.94, stiffness: 0.05, drag: 1.4 })];
  private waistRibbons = [new Chain({ segments: 8, length: 11, gravity: 650, damping: 0.95, stiffness: 0.04, drag: 1.6 }), new Chain({ segments: 7, length: 11, gravity: 650, damping: 0.95, stiffness: 0.04, drag: 1.6 })];
  private robeFront = new Chain({ segments: 5, length: 22, gravity: 900, damping: 0.9, stiffness: (i) => 0.28 - i * 0.04, drag: 0.45 });
  private robeBack = new Chain({ segments: 5, length: 22, gravity: 900, damping: 0.9, stiffness: (i) => 0.24 - i * 0.035, drag: 0.6 });
  private tassel = new Chain({ segments: 4, length: 6.5, gravity: 800, damping: 0.93, stiffness: 0.01, drag: 0.8 });
  private sleeves: Sleeve[] = [];

  private gPonytail = new Graphics();
  private gHairTails = new Graphics();
  private gSideLocks = new Graphics();
  private gRibbons = new Graphics();
  private gRobeFront = new Graphics();
  private gRobeBack = new Graphics();
  private gTassel = new Graphics();
  private gTrail = new Graphics();

  private trail: SwordTrailSample[] = [];
  trailOn = false;
  /** relative air flow (px/s^2) – e.g. running pushes everything backwards */
  wind: Pt = { x: 0, y: 0 };
  private time = 0;
  private blinkT = 2;
  private expression: Expression = 'normal';
  private exprHold = 0;
  private flash = 0;
  current: ClipName = 'idle';
  private queue: ClipName[] = [];

  constructor(loadout: Loadout) {
    this.loadout = loadout;
    for (const arm of ['B', 'F'] as const) {
      this.sleeves.push({
        arm,
        wrist: new Chain({ segments: 4, length: 12, gravity: 900, damping: 0.92, stiffness: 0.03, drag: 0.8 }),
        elbow: new Chain({ segments: 4, length: 9, gravity: 900, damping: 0.92, stiffness: 0.03, drag: 0.8 }),
        g: new Graphics(),
      });
    }
    this.gTrail.blendMode = 'add';
    this.build();
    this.anim.wrapBones.add('swordWorld');
    this.anim.onEnd = () => this.onClipEnd();
    this.anim.onEvent = (n) => this.onClipEvent(n);
    this.play('idle', 0);
  }

  private bone(name: string) {
    return this.skel.get(name);
  }

  /** (Re)build every static part for the current loadout and order all layers. */
  build(): void {
    for (const g of this.staticGfx.values()) g.destroy({ children: true });
    this.staticGfx.clear();
    this.slots = [];
    if (this.head) this.head.root.destroy({ children: true });
    this.view.removeChildren();

    const o = this.loadout.outfit;
    const w = this.loadout.weapon;
    const mk = (bone: string, draw: (g: Graphics) => void, tint?: number): Container => {
      const g = new Graphics();
      draw(g);
      if (tint) g.tint = tint;
      this.staticGfx.set(bone + this.staticGfx.size, g);
      const slot = new Slot(this.bone(bone), g);
      this.slots.push(slot);
      return g;
    };

    for (const s of this.sleeves) {
      const k = o.sleeveWidth;
      s.wrist.lens.fill(3 + 10 * k);
      s.elbow.lens.fill(2 + 4 * k);
      s.g.tint = s.arm === 'B' ? BACK_TINT : 0xffffff;
    }
    const sleeveB = this.sleeves[0];
    const sleeveF = this.sleeves[1];
    const robeLen = 16 + 7 * o.robeLength;
    this.robeFront.lens.fill(robeLen);
    this.robeBack.lens.fill(robeLen);

    this.head = buildHead(this.loadout.headgear);
    this.headSlot = new Slot(this.bone('head'), this.head.root);
    this.slots.push(this.headSlot);
    this.head.setExpression(this.expression);

    this.shadow.clear();
    this.shadow.ellipse(0, 0, 70, 12).fill(rad([[0, '#000000aa'], [0.6, '#00000044'], [1, '#00000000']]));

    const layers: Container[] = [
      this.shadow,
      this.gPonytail,
      this.gHairTails,
      sleeveB.g,
      mk('upperArmB', (g) => drawUpperArm(g, o), BACK_TINT),
      mk('forearmB', (g) => drawForearm(g, o), BACK_TINT),
      mk('handB', drawOpenHand, BACK_TINT),
      this.gRobeBack,
      mk('thighB', (g) => drawThigh(g, o), BACK_TINT),
      mk('shinB', (g) => drawShin(g, o), BACK_TINT),
      mk('footB', (g) => drawFoot(g, o), BACK_TINT),
      mk('scabbard', (g) => drawScabbard(g, w, o), 0xd8dde6),
      mk('thighF', (g) => drawThigh(g, o)),
      mk('shinF', (g) => drawShin(g, o)),
      mk('footF', (g) => drawFoot(g, o)),
      this.gRobeFront,
      mk('root', (g) => drawHipSkirt(g, o)),
      mk('neck', drawNeck),
      mk('chest', (g) => drawTorso(g, o)),
      mk('spine', (g) => drawSash(g, o)),
      this.gRibbons,
      this.head.root,
      this.gSideLocks,
      mk('upperArmF', (g) => drawUpperArm(g, o)),
      sleeveF.g,
      mk('forearmF', (g) => drawForearm(g, o)),
      mk('sword', (g) => drawSword(g, w)),
      this.gTassel,
      mk('handF', drawFist),
      this.gTrail,
    ];
    this.view.addChild(...layers);
  }

  setLoadout(l: Loadout): void {
    this.loadout = l;
    this.build();
    this.skel.update();
    for (const s of this.slots) s.sync();
  }

  play(name: ClipName, fade = 0.12): void {
    this.queue = [];
    this.current = name;
    this.anim.play(CLIPS[name], fade);
    if (name === 'hurt') {
      this.flash = 1;
      this.setExpr('hurt', 0.45);
    }
  }

  /** Play a one-shot sequence, then return to `then`. */
  sequence(names: ClipName[], then: ClipName): void {
    this.play(names[0]);
    this.queue = [...names.slice(1), then];
  }

  get clip(): Clip | null {
    return this.anim.clip;
  }

  private onClipEnd(): void {
    const next = this.queue.shift();
    if (next) {
      const rest = this.queue;
      this.play(next, next.startsWith('attack') ? 0.06 : 0.18);
      this.queue = rest;
    }
  }

  private onClipEvent(name: string): void {
    if (name === 'trailOn') this.trailOn = true;
    else if (name === 'trailOff') this.trailOn = false;
    else if (name === 'fierce') this.setExpr('fierce', 0.35);
    this.onEvent?.(name);
  }

  onEvent?: (name: string) => void;

  private setExpr(e: Expression, hold: number): void {
    this.expression = e;
    this.exprHold = hold;
    this.head.setExpression(e);
  }

  update(dt: number): void {
    this.time += dt;
    this.anim.update(dt);
    // breathing layered on top of whatever plays
    const pose = this.anim.pose;
    const br = Math.sin(this.time * 2 * Math.PI / 3.4);
    if (pose.chest) pose.chest.sy *= 1 + br * 0.008;
    this.skel.apply(pose);
    this.skel.update();
    // the blade is animated by its world angle; derive the wrist-relative rotation from it
    const aim = pose.swordWorld;
    if (aim) {
      const sw = this.bone('sword');
      sw.rot = aim.rot - (sw.parent!.worldAngle * 180) / Math.PI;
      this.skel.update();
    }
    for (const s of this.slots) s.sync();

    // facial
    if (this.exprHold > 0) {
      this.exprHold -= dt;
      if (this.exprHold <= 0) this.setExpr('normal', 0);
    } else {
      this.blinkT -= dt;
      if (this.blinkT <= 0) {
        this.head.setExpression('blink');
        if (this.blinkT < -0.11) {
          this.head.setExpression('normal');
          this.blinkT = 2.2 + Math.random() * 3;
        }
      }
    }
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 3.5);
      const f = this.flash;
      const g = Math.round(255 - 120 * f);
      const tint = (255 << 16) | (g << 8) | g;
      for (const s of this.slots) (s.view as Graphics).tint = tint;
    } else {
      for (const s of this.slots) {
        const n = s.bone.name;
        (s.view as Graphics).tint = n.endsWith('B') ? BACK_TINT : n === 'scabbard' ? 0xd8dde6 : 0xffffff;
      }
    }

    this.updatePhysics(dt);
    this.drawDynamic(dt);
  }

  private updatePhysics(dt: number): void {
    const sk = this.skel;
    const t = this.time;
    const wind = { x: this.wind.x + Math.sin(t * 0.7) * 40, y: this.wind.y };
    const headA = this.bone('head').worldAngle;

    // ponytail rises back from the tie, then falls
    const pr = sk.point('head', PONYTAIL_ROOT.x, PONYTAIL_ROOT.y);
    const ptShape = [96, 66, 44, 30, 21, 15, 11, 8, 6];
    this.ponytail.step(dt, pr, (i) => headA * 0.6 + ptShape[i] * DEG, wind, t);

    const sl = sk.point('head', SIDELOCK_ROOT.x, SIDELOCK_ROOT.y);
    this.sideLocks[0].step(dt, sl, (i) => headA + (-10 + i * 7) * DEG, { x: wind.x * 0.4, y: 0 }, t);
    const sl2 = sk.point('head', SIDELOCK_ROOT.x - 3, SIDELOCK_ROOT.y + 1);
    this.sideLocks[1].step(dt, sl2, (i) => headA + (4 + i * 6) * DEG, { x: wind.x * 0.4, y: 0 }, t + 1);

    const hr = sk.point('head', PONYTAIL_ROOT.x - 2, PONYTAIL_ROOT.y + 3);
    this.hairTails[0].step(dt, hr, (i) => headA + (40 - i * 4) * DEG, wind, t + 2);
    this.hairTails[1].step(dt, sk.point('head', PONYTAIL_ROOT.x - 1, PONYTAIL_ROOT.y + 4), (i) => headA + (22 - i * 3) * DEG, wind, t + 3.3);

    const spineA = this.bone('spine').worldAngle;
    this.waistRibbons[0].step(dt, sk.point('spine', 11, 7), (i) => spineA + (14 + i * 2) * DEG, wind, t + 4);
    this.waistRibbons[1].step(dt, sk.point('spine', 9, 8), (i) => spineA + (4 + i * 2) * DEG, wind, t + 5.1);

    const tf = this.bone('thighF').worldAngle;
    const tb = this.bone('thighB').worldAngle;
    const fwd = tf * 0.8 + Math.min(tf, tb) * 0.2;
    const back = Math.max(tf, tb);
    const rootA = this.bone('root').worldAngle;
    this.robeFront.step(dt, sk.point('root', 4, 14), (i) => rootA + (fwd - rootA) * 0.9 - (2 + i * 2.5) * DEG, { x: wind.x, y: 0 }, t);
    this.robeBack.step(dt, sk.point('root', -8, 12), (i) => rootA + (back - rootA) * 0.85 + (6 + i * 3) * DEG, { x: wind.x, y: 0 }, t + 0.5);

    for (const s of this.sleeves) {
      const fa = 'forearm' + s.arm;
      const a = this.bone(fa).worldAngle;
      // sleeve sack hangs under gravity, slightly following the arm
      const hang = (i: number) => a * 0.2 + (10 + i * 5) * DEG;
      s.wrist.step(dt, sk.point(fa, -8.6, 47), hang, wind, t + (s.arm === 'F' ? 0 : 1.7));
      s.elbow.step(dt, sk.point(fa, -7.4, 16), hang, wind, t + 0.6);
    }

    const sw = this.bone('sword');
    this.tassel.step(dt, sk.point('sword', 0, -18.5), (i) => sw.worldAngle + Math.PI + i * 0, wind, t);
  }

  private drawDynamic(dt: number): void {
    const o = this.loadout.outfit;
    const hg = this.loadout.headgear;
    const w = this.loadout.weapon;

    // ponytail: main mass + sub strands + sheen
    const g = this.gPonytail.clear();
    const pts = this.ponytail.points;
    strip(g, pts, (t) => (t < 0.12 ? 9 + t * 60 : 16.2 * (1 - t) ** 0.8 + 1.5)).fill(lin([[0, HAIR.mid], [0.5, HAIR.base], [1, HAIR.dark]], 0, 0, 1, 1)).stroke({ width: 0.8, color: HAIR.line, alpha: 0.9 });
    strip(g, pts.slice(1), (t) => 7 * (1 - t) + 0.8, (t) => 4 + t * 3).fill({ color: HAIR.base });
    strip(g, pts.slice(0, 8), (t) => 5 * (1 - t) + 0.6, (t) => -3 - t * 2).fill({ color: HAIR.dark, alpha: 0.9 });
    strip(g, pts.slice(1, 6), (t) => 2.2 * Math.sin(Math.PI * t) + 0.2, () => -1).fill({ color: HAIR.shine, alpha: 0.45 });
    for (const off of [-3, 1.5, 4.5]) {
      spline(g, stripOutline(pts.slice(1), () => 0, () => off).slice(0, pts.length - 1)).stroke({ width: 0.5, color: HAIR.light, alpha: 0.35, cap: 'round' });
    }

    // hair ornament tails
    const ht = this.gHairTails.clear();
    if (hg.kind === 'ribbon') {
      for (const c of this.hairTails) strip(ht, c.points, (t) => 4.2 - t * 1.2).fill(lin([[0, hg.main[0]], [1, hg.main[1]]], 0, 0, 1, 0)).stroke({ width: 0.5, color: '#1b3f40' });
    } else if (hg.kind === 'phoenix') {
      for (const c of this.hairTails.slice(0, 2)) {
        const p = c.points.slice(0, 5);
        spline(ht, p).stroke({ width: 0.6, color: hg.main[1] });
        p.forEach((n, i) => i > 0 && ht.circle(n.x, n.y, i === p.length - 1 ? 1.9 : 1.1).fill(i === p.length - 1 ? hg.accent : hg.main[0]));
      }
    } else {
      const p = this.hairTails[1].points.slice(0, 4);
      spline(ht, p).stroke({ width: 0.5, color: hg.accent });
      const e = p[p.length - 1];
      ht.ellipse(e.x, e.y + 1.5, 1.6, 2.4).fill(hg.main[0]).stroke({ width: 0.4, color: '#1f5a44' });
    }

    // side locks over the cheek
    const sg = this.gSideLocks.clear();
    strip(sg, this.sideLocks[0].points, (t) => 2.8 * (1 - t) ** 0.7 + 0.2).fill(lin([[0, HAIR.mid], [1, HAIR.base]])).stroke({ width: 0.5, color: HAIR.line, alpha: 0.8 });
    strip(sg, this.sideLocks[1].points, (t) => 2 * (1 - t) ** 0.7 + 0.2).fill(HAIR.base).stroke({ width: 0.5, color: HAIR.line, alpha: 0.8 });

    // waist ribbons
    const rg = this.gRibbons.clear();
    this.waistRibbons.forEach((c, k) => {
      strip(rg, c.points, (t) => 4.6 - t * 0.8).fill(lin([[0, o.ribbon[0]], [1, o.ribbon[1]]], 0, 0, 1, 0)).stroke({ width: 0.55, color: o.robeLine, alpha: 0.8 });
      const e = c.points[c.points.length - 1];
      rg.circle(e.x, e.y, 1.8 - k * 0.3).fill(o.sashGem).stroke({ width: 0.4, color: o.robeLine });
    });

    // robe panels
    this.drawPanel(this.gRobeBack, this.robeBack.points, 26, 40, false);
    this.drawPanel(this.gRobeFront, this.robeFront.points, 30, 38, true);

    // sleeves
    for (const s of this.sleeves) {
      const fa = 'forearm' + s.arm;
      const sk = this.skel;
      const sg2 = s.g.clear();
      const wr = s.wrist.points;
      const el = s.elbow.points;
      const tipW = wr[wr.length - 1];
      const tipE = el[el.length - 1];
      const sag = { x: (tipW.x + tipE.x) / 2, y: (tipW.y + tipE.y) / 2 + 6 };
      const outline: Pt[] = [sk.point(fa, -7.4, 12), sk.point(fa, -8.4, 30), sk.point(fa, -8.8, 47), ...wr.slice(1), sag, ...el.slice(1).reverse()];
      spline(sg2, outline, true, 0.45)
        .fill(lin([[0, o.robe[0]], [0.5, o.robe[1]], [1, o.robe[2]]], 0, 0, 0.4, 1))
        .stroke({ width: 1, color: o.robeLine, join: 'round' });
      // dark inside of the open cuff, then the trim around it
      const inner: Pt[] = [sk.point(fa, 7.6, 47), sk.point(fa, 0, 48.5), ...wr.slice(0, 3), wr[2]];
      const w2 = wr[2];
      const back = { x: (w2.x + sk.point(fa, 7.6, 47).x) / 2 + 3, y: (w2.y + sk.point(fa, 7.6, 47).y) / 2 };
      spline(sg2, [...inner.slice(0, -1), back], true).fill({ color: o.robeLine, alpha: 0.55 });
      const cuff = [sk.point(fa, 8.6, 47.5), sk.point(fa, 0, 49), ...wr.slice(0)];
      strip(sg2, cuff, () => 3.2).fill(o.trim);
      // fold lines
      for (let i = 1; i < Math.min(wr.length, el.length); i++) {
        const a = wr[i];
        const b = el[i];
        sg2.moveTo(a.x * 0.6 + b.x * 0.4, a.y * 0.6 + b.y * 0.4).lineTo(a.x * 0.2 + b.x * 0.8, a.y * 0.2 + b.y * 0.8);
      }
      sg2.stroke({ width: 0.7, color: o.robe[2], alpha: 0.7 });
    }

    // sword tassel
    const tg = this.gTassel.clear();
    const tp = this.tassel.points;
    spline(tg, tp.slice(0, 3)).stroke({ width: 0.9, color: w.tassel[1] });
    tg.circle(tp[2].x, tp[2].y, 2).fill(w.tassel[0]).stroke({ width: 0.4, color: '#222' });
    strip(tg, tp.slice(2), (t) => 2.5 + t * 3).fill(lin([[0, w.tassel[0]], [1, w.tassel[1]]])).stroke({ width: 0.4, color: w.tassel[1] });

    this.updateTrail(dt);
  }

  private drawPanel(g: Graphics, pts: Pt[], w0: number, w1: number, front: boolean): void {
    const o = this.loadout.outfit;
    g.clear();
    const widthAt = (t: number) => w0 + (w1 - w0) * t;
    strip(g, pts, widthAt)
      .fill(lin([[0, o.robe[front ? 1 : 2]], [0.6, o.robe[front ? 0 : 1]], [1, o.robe[1]]], 0, 0, 0.3, 1))
      .stroke({ width: 1.05, color: o.robeLine, join: 'round' });
    const outline = stripOutline(pts, widthAt);
    const n = pts.length;
    const left = outline.slice(0, n);
    const right = outline.slice(n).reverse();
    // hem trim and leading-edge trim
    const hemL = left[n - 1];
    const hemR = right[n - 1];
    g.moveTo(hemL.x, hemL.y).lineTo(hemR.x, hemR.y).stroke({ width: 3.2, color: o.trim, cap: 'round' });
    spline(g, front ? right.slice(1) : left.slice(1)).stroke({ width: 2.6, color: o.trim, alpha: front ? 1 : 0.8, cap: 'round' });
    // folds
    for (const f of [0.3, 0.65]) {
      const fp = pts.map((_, i) => ({ x: left[i].x + (right[i].x - left[i].x) * f, y: left[i].y + (right[i].y - left[i].y) * f }));
      spline(g, fp.slice(1)).stroke({ width: 0.8, color: o.robe[2], alpha: 0.55, cap: 'round' });
    }
  }

  private updateTrail(dt: number): void {
    const w = this.loadout.weapon;
    for (const s of this.trail) s.age += dt;
    if (this.trailOn) {
      this.trail.push({ base: this.skel.point('sword', 0, w.bladeLen * 0.3), tip: this.skel.point('sword', 0, w.bladeLen + 4), age: 0 });
    }
    const life = 0.16;
    this.trail = this.trail.filter((s) => s.age < life);
    const g = this.gTrail.clear();
    const n = this.trail.length;
    if (n < 2) return;
    // subdivide with Catmull-Rom for a smooth arc
    const tips: Pt[] = [];
    const bases: Pt[] = [];
    const ages: number[] = [];
    const cr = (a: Pt, b: Pt, c: Pt, d: Pt, u: number): Pt => {
      const u2 = u * u;
      const u3 = u2 * u;
      const f = (p0: number, p1: number, p2: number, p3: number) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
      return { x: f(a.x, b.x, c.x, d.x), y: f(a.y, b.y, c.y, d.y) };
    };
    for (let i = 0; i < n - 1; i++) {
      const i0 = this.trail[Math.max(i - 1, 0)];
      const i1 = this.trail[i];
      const i2 = this.trail[i + 1];
      const i3 = this.trail[Math.min(i + 2, n - 1)];
      for (let k = 0; k < 4; k++) {
        const u = k / 4;
        tips.push(cr(i0.tip, i1.tip, i2.tip, i3.tip, u));
        bases.push(cr(i0.base, i1.base, i2.base, i3.base, u));
        ages.push(i1.age + (i2.age - i1.age) * u);
      }
    }
    tips.push(this.trail[n - 1].tip);
    bases.push(this.trail[n - 1].base);
    ages.push(this.trail[n - 1].age);
    for (let i = 0; i < tips.length - 1; i++) {
      const a = 1 - ages[i] / life;
      const m0 = { x: bases[i].x + (tips[i].x - bases[i].x) * 0.55, y: bases[i].y + (tips[i].y - bases[i].y) * 0.55 };
      const m1 = { x: bases[i + 1].x + (tips[i + 1].x - bases[i + 1].x) * 0.55, y: bases[i + 1].y + (tips[i + 1].y - bases[i + 1].y) * 0.55 };
      g.poly([bases[i].x, bases[i].y, tips[i].x, tips[i].y, tips[i + 1].x, tips[i + 1].y, bases[i + 1].x, bases[i + 1].y]).fill({ color: w.glow, alpha: 0.32 * a * a });
      g.poly([m0.x, m0.y, tips[i].x, tips[i].y, tips[i + 1].x, tips[i + 1].y, m1.x, m1.y]).fill({ color: w.glowCore, alpha: 0.5 * a * a * a });
    }
  }
}
