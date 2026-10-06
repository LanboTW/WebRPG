import { Container, Graphics } from 'pixi.js';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  w: number;
}

/** Additive streak sparks + a ring flash for sword hits. */
export class Sparks {
  readonly view = new Container();
  private g = new Graphics();
  private list: Spark[] = [];
  private rings: { x: number; y: number; t: number; color: string; big: boolean }[] = [];
  private color = '#ffffff';

  constructor() {
    this.g.blendMode = 'add';
    this.view.addChild(this.g);
  }

  burst(x: number, y: number, color: string, n: number, dir: number): void {
    this.color = color;
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * Math.PI * 1.4 + (dir > 0 ? 0 : Math.PI);
      const sp = 280 + Math.random() * 520;
      const max = 0.18 + Math.random() * 0.25;
      this.list.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: max, max, w: 1.2 + Math.random() * 2 });
    }
    this.rings.push({ x, y, t: 0, color, big: n > 16 });
  }

  update(dt: number): void {
    const g = this.g.clear();
    for (const s of this.list) {
      s.life -= dt;
      s.vy += 900 * dt;
      s.vx *= 0.9;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = Math.max(0, s.life / s.max);
      g.moveTo(s.x, s.y).lineTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03).stroke({ width: s.w * k + 0.3, color: this.color, alpha: k, cap: 'round' });
      g.circle(s.x, s.y, s.w * 0.6 * k).fill({ color: '#ffffff', alpha: k });
    }
    this.list = this.list.filter((s) => s.life > 0);
    for (const r of this.rings) {
      r.t += dt;
      const k = r.t / 0.3;
      const rad = (r.big ? 90 : 50) * (0.3 + k);
      g.circle(r.x, r.y, rad).stroke({ width: (r.big ? 10 : 6) * (1 - k), color: r.color, alpha: 0.8 * (1 - k) });
      g.circle(r.x, r.y, rad * 0.35 * (1 - k)).fill({ color: '#ffffff', alpha: 0.7 * (1 - k) });
    }
    this.rings = this.rings.filter((r) => r.t < 0.3);
  }
}
