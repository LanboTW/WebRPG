import type { Pt } from './draw';

export interface ChainOptions {
  segments: number;
  length: number | number[];
  gravity?: number; // px/s^2
  damping?: number; // 0..1 velocity kept per 1/60s
  /** pull towards target shape, per segment (root → tip) */
  stiffness?: number | ((i: number) => number);
  iterations?: number;
  /** how much the chain catches the wind */
  drag?: number;
}

interface Node {
  x: number;
  y: number;
  px: number;
  py: number;
}

const STEP = 1 / 120;

/**
 * Verlet chain pinned at node 0. Each segment is pulled towards a target world angle
 * (bone convention: dir = (-sin a, cos a)), which keeps hair and cloth in shape while
 * gravity, inertia and wind add the swing.
 */
export class Chain {
  readonly nodes: Node[] = [];
  readonly lens: number[];
  private acc = 0;
  private initialized = false;
  gravity: number;
  damping: number;
  stiffness: (i: number) => number;
  iterations: number;
  drag: number;

  constructor(o: ChainOptions) {
    this.lens = Array.from({ length: o.segments }, (_, i) => (Array.isArray(o.length) ? o.length[i] : (o.length as number)));
    for (let i = 0; i <= o.segments; i++) this.nodes.push({ x: 0, y: 0, px: 0, py: 0 });
    this.gravity = o.gravity ?? 900;
    this.damping = o.damping ?? 0.94;
    const s = o.stiffness ?? 0.15;
    this.stiffness = typeof s === 'function' ? s : () => s;
    this.iterations = o.iterations ?? 3;
    this.drag = o.drag ?? 1;
  }

  get points(): Pt[] {
    return this.nodes;
  }

  reset(anchor: Pt, angle: (i: number) => number): void {
    let x = anchor.x;
    let y = anchor.y;
    this.nodes[0].x = this.nodes[0].px = x;
    this.nodes[0].y = this.nodes[0].py = y;
    for (let i = 1; i < this.nodes.length; i++) {
      const a = angle(i - 1);
      x += -Math.sin(a) * this.lens[i - 1];
      y += Math.cos(a) * this.lens[i - 1];
      const n = this.nodes[i];
      n.x = n.px = x;
      n.y = n.py = y;
    }
    this.initialized = true;
  }

  /**
   * @param anchor pinned root position this frame
   * @param angle target world angle for segment i
   * @param wind horizontal/vertical force (px/s^2), scaled by drag and increasing towards the tip
   */
  step(dt: number, anchor: Pt, angle: (i: number) => number, wind: Pt = { x: 0, y: 0 }, time = 0): void {
    if (!this.initialized) this.reset(anchor, angle);
    const n0 = this.nodes[0];
    const startX = n0.x;
    const startY = n0.y;
    this.acc += Math.min(dt, 0.1);
    const steps = Math.floor(this.acc / STEP);
    this.acc -= steps * STEP;
    const damp = Math.pow(this.damping, STEP * 60);
    for (let s = 1; s <= steps; s++) {
      const f = s / steps;
      n0.x = startX + (anchor.x - startX) * f;
      n0.y = startY + (anchor.y - startY) * f;
      const N = this.nodes.length;
      for (let i = 1; i < N; i++) {
        const n = this.nodes[i];
        const vx = (n.x - n.px) * damp;
        const vy = (n.y - n.py) * damp;
        n.px = n.x;
        n.py = n.y;
        const tip = i / (N - 1);
        const flutter = Math.sin(time * 9 + i * 1.3) * 0.35 + Math.sin(time * 5.3 + i * 0.7) * 0.25;
        const wx = wind.x * this.drag * (0.4 + tip) * (1 + flutter * 0.6);
        const wy = wind.y * this.drag * (0.4 + tip) + Math.abs(wind.x) * this.drag * flutter * 0.35 * tip;
        n.x += vx + wx * STEP * STEP;
        n.y += vy + (this.gravity + wy) * STEP * STEP;
      }
      // shape keeping
      for (let i = 1; i < N; i++) {
        const a = angle(i - 1);
        const p = this.nodes[i - 1];
        const n = this.nodes[i];
        const tx = p.x - Math.sin(a) * this.lens[i - 1];
        const ty = p.y + Math.cos(a) * this.lens[i - 1];
        const k = this.stiffness(i - 1);
        n.x += (tx - n.x) * k;
        n.y += (ty - n.y) * k;
      }
      for (let it = 0; it < this.iterations; it++) {
        for (let i = 1; i < N; i++) {
          const p = this.nodes[i - 1];
          const n = this.nodes[i];
          const dx = n.x - p.x;
          const dy = n.y - p.y;
          const d = Math.hypot(dx, dy) || 0.0001;
          const diff = (d - this.lens[i - 1]) / d;
          if (i === 1) {
            n.x -= dx * diff;
            n.y -= dy * diff;
          } else {
            n.x -= dx * diff * 0.5;
            n.y -= dy * diff * 0.5;
            p.x += dx * diff * 0.5;
            p.y += dy * diff * 0.5;
          }
        }
      }
    }
    n0.x = anchor.x;
    n0.y = anchor.y;
    n0.px = anchor.x;
    n0.py = anchor.y;
  }

  /** Shift every node (e.g. when the owner teleports or turns) without injecting velocity. */
  translate(dx: number, dy: number): void {
    for (const n of this.nodes) {
      n.x += dx;
      n.y += dy;
      n.px += dx;
      n.py += dy;
    }
  }
}
