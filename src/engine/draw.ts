import { FillGradient, Graphics } from 'pixi.js';

export interface Pt {
  x: number;
  y: number;
}

export type Stops = [number, string][];

const gradCache = new Map<string, FillGradient>();

/** Linear gradient in shape-local (bounding box) space, cached so per-frame redraws don't leak textures. */
export function lin(stops: Stops, x0 = 0, y0 = 0, x1 = 0, y1 = 1): FillGradient {
  const key = `L${x0},${y0},${x1},${y1}|${stops.map((s) => s.join(':')).join('|')}`;
  let g = gradCache.get(key);
  if (!g) {
    g = new FillGradient({
      type: 'linear',
      start: { x: x0, y: y0 },
      end: { x: x1, y: y1 },
      colorStops: stops.map(([offset, color]) => ({ offset, color })),
      textureSpace: 'local',
    });
    gradCache.set(key, g);
  }
  return g;
}

export function rad(stops: Stops, cx = 0.5, cy = 0.5, r = 0.5): FillGradient {
  const key = `R${cx},${cy},${r}|${stops.map((s) => s.join(':')).join('|')}`;
  let g = gradCache.get(key);
  if (!g) {
    g = new FillGradient({
      type: 'radial',
      center: { x: cx, y: cy },
      innerRadius: 0,
      outerCenter: { x: cx, y: cy },
      outerRadius: r,
      colorStops: stops.map(([offset, color]) => ({ offset, color })),
      textureSpace: 'local',
    });
    gradCache.set(key, g);
  }
  return g;
}

/** Catmull-Rom spline through points, emitted as cubic beziers. */
export function spline(g: Graphics, pts: Pt[], closed = false, tension = 0.5, moveFirst = true): Graphics {
  const n = pts.length;
  if (n < 2) return g;
  if (moveFirst) g.moveTo(pts[0].x, pts[0].y);
  const k = tension / 3;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = pts[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[closed ? (i + 2) % n : Math.min(i + 2, n - 1)];
    g.bezierCurveTo(
      p1.x + (p2.x - p0.x) * k,
      p1.y + (p2.y - p0.y) * k,
      p2.x - (p3.x - p1.x) * k,
      p2.y - (p3.y - p1.y) * k,
      p2.x,
      p2.y,
    );
  }
  if (closed) g.closePath();
  return g;
}

/** Shorthand: flat array [x,y,x,y...] → points. */
export function P(...a: number[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < a.length; i += 2) out.push({ x: a[i], y: a[i + 1] });
  return out;
}

/** Build the outline polygon of a strip of varying width along a polyline. */
export function stripOutline(pts: Pt[], widths: number[] | ((t: number) => number), offset: number[] | ((t: number) => number) = () => 0): Pt[] {
  const n = pts.length;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(i - 1, 0)];
    const b = pts[Math.min(i + 1, n - 1)];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const t = i / (n - 1);
    const w = (typeof widths === 'function' ? widths(t) : widths[i]) / 2;
    const o = typeof offset === 'function' ? offset(t) : offset[i];
    const nx = -dy;
    const ny = dx;
    left.push({ x: pts[i].x + nx * (w + o), y: pts[i].y + ny * (w + o) });
    right.push({ x: pts[i].x - nx * (w - o), y: pts[i].y - ny * (w - o) });
  }
  return left.concat(right.reverse());
}

/** Smooth closed strip: two splines (left forward, right backward) joined with rounded ends. */
export function strip(g: Graphics, pts: Pt[], widths: number[] | ((t: number) => number), offset?: number[] | ((t: number) => number)): Graphics {
  const o = stripOutline(pts, widths, offset);
  const half = o.length / 2;
  const left = o.slice(0, half);
  const right = o.slice(half);
  spline(g, left);
  g.lineTo(right[0].x, right[0].y);
  spline(g, right, false, 0.5, false);
  g.closePath();
  return g;
}

/** Tapered limb along +y with bulges; widths at top, middle, bottom; `bulge` biases mid towards front(+x)/back(-x). */
export function limb(g: Graphics, len: number, wTop: number, wMid: number, wBot: number, bulgeFront = 0, bulgeBack = 0, midAt = 0.4): Graphics {
  const t = wTop / 2;
  const m = wMid / 2;
  const b = wBot / 2;
  const my = len * midAt;
  g.moveTo(-t, 0);
  g.bezierCurveTo(-t, -t * 0.9, t, -t * 0.9, t, 0);
  g.bezierCurveTo(t + bulgeFront * 0.5, my * 0.5, m + bulgeFront, my, m + bulgeFront * 0.6, my + (len - my) * 0.35);
  g.bezierCurveTo(m * 0.9, len * 0.85, b * 1.05, len * 0.95, b, len);
  g.bezierCurveTo(b, len + b * 0.9, -b, len + b * 0.9, -b, len);
  g.bezierCurveTo(-b * 1.05, len * 0.95, -m * 0.95 - bulgeBack * 0.3, len * 0.8, -m - bulgeBack, my + (len - my) * 0.2);
  g.bezierCurveTo(-m - bulgeBack * 0.8, my * 0.6, -t, my * 0.3, -t, 0);
  g.closePath();
  return g;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}

export function mixColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const gg = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return '#' + ((1 << 24) | (r << 16) | (gg << 8) | bl).toString(16).slice(1);
}

export const DEG = Math.PI / 180;
