import { Container, Graphics, Sprite, Texture, type Renderer } from 'pixi.js';
import { lin, rad } from '../engine/draw';

/** Bamboo forest backdrop with parallax layers, god rays, mist and falling leaves. Virtual height 720. */

const WRAP = 1800;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function bamboo(g: Graphics, x: number, top: number, bottom: number, w: number, lean: number, colors: [string, string, string], node: string, leaves: boolean, r: () => number): void {
  const segs = Math.ceil((bottom - top) / (w * 5.5));
  const dx = lean;
  for (let i = 0; i < segs; i++) {
    const y0 = top + ((bottom - top) * i) / segs;
    const y1 = top + ((bottom - top) * (i + 1)) / segs;
    const x0 = x + dx * (1 - (y0 - top) / (bottom - top));
    const x1 = x + dx * (1 - (y1 - top) / (bottom - top));
    g.moveTo(x0 - w / 2, y0).lineTo(x0 + w / 2, y0).lineTo(x1 + w / 2, y1 - 2).lineTo(x1 - w / 2, y1 - 2).closePath()
      .fill(lin([[0, colors[2]], [0.3, colors[0]], [0.6, colors[1]], [1, colors[2]]], 0, 0, 1, 0));
    g.roundRect(x1 - w / 2 - 1, y1 - 3, w + 2, 3, 1.5).fill(node);
  }
  if (leaves) {
    const count = 2 + Math.floor(r() * 3);
    for (let k = 0; k < count; k++) {
      const yy = top + (bottom - top) * (0.05 + r() * 0.5);
      const xx = x + dx * (1 - (yy - top) / (bottom - top));
      const dir = r() < 0.5 ? -1 : 1;
      for (let j = 0; j < 4; j++) {
        const len = w * (4 + r() * 4);
        const ang = (dir > 0 ? 0.25 : Math.PI - 0.25) + (r() - 0.5) * 0.9;
        const ex = xx + Math.cos(ang) * len;
        const ey = yy + Math.sin(ang) * len + len * 0.3;
        const nx = -Math.sin(ang) * len * 0.12;
        const ny = Math.cos(ang) * len * 0.12;
        const mx = (xx + ex) / 2;
        const my = (yy + ey) / 2;
        g.moveTo(xx, yy).quadraticCurveTo(mx + nx, my + ny, ex, ey).quadraticCurveTo(mx - nx, my - ny, xx, yy).fill(colors[j % 2]);
      }
    }
  }
}

interface Layer {
  view: Container;
  factor: number;
}

interface Leaf {
  s: Sprite;
  vx: number;
  vy: number;
  spin: number;
  phase: number;
  z: number;
}

export class Backdrop {
  readonly view = new Container();
  private layers: Layer[] = [];
  private leaves: Leaf[] = [];
  private rays = new Graphics();
  private leafLayer = new Container();
  private time = 0;
  scroll = 0;
  width = 1280;

  constructor(renderer: Renderer) {
    const sky = new Graphics();
    sky.rect(0, 0, 4000, 720).fill(lin([[0, '#29504c'], [0.4, '#6f9a84'], [0.72, '#c9d6ac'], [1, '#efe7c2']]));
    sky.ellipse(980, 260, 520, 260).fill({ fill: rad([[0, '#fff6d8'], [0.4, '#f5e6b080'], [1, '#f5e6b000']]), alpha: 0.75 });
    this.view.addChild(sky);

    const mk = (factor: number, build: (g: Graphics, r: () => number) => void, seed: number, alpha = 1) => {
      const c = new Container();
      for (let k = 0; k < 2; k++) {
        const g = new Graphics();
        build(g, rng(seed));
        g.x = k * WRAP;
        c.addChild(g);
      }
      c.alpha = alpha;
      this.view.addChild(c);
      this.layers.push({ view: c, factor });
    };

    // far misty stalks
    mk(0.15, (g, r) => {
      for (let i = 0; i < 40; i++) bamboo(g, r() * WRAP, -40, 620, 7 + r() * 5, (r() - 0.5) * 30, ['#8fae9a', '#7b9c8a', '#6d8c7c'], '#a3bfae', r() < 0.4, r);
    }, 11, 0.55);
    const mist1 = new Graphics();
    mist1.rect(0, 380, 4000, 340).fill(lin([[0, '#d9e3c800'], [0.5, '#d9e3c8aa'], [1, '#c7d4b8']]));
    this.view.addChild(mist1);
    // mid stalks
    mk(0.4, (g, r) => {
      for (let i = 0; i < 26; i++) bamboo(g, r() * WRAP, -60, 640, 12 + r() * 8, (r() - 0.5) * 40, ['#6a9566', '#4f7c52', '#335a3a'], '#93b884', r() < 0.6, r);
    }, 23, 0.9);
    const mist2 = new Graphics();
    mist2.rect(0, 520, 4000, 200).fill(lin([[0, '#cfdcbf00'], [1, '#b8c8a4cc']]));
    this.view.addChild(mist2);

    // ground: stone path + grass
    mk(1, (g, r) => {
      g.rect(0, 600, WRAP, 120).fill(lin([[0, '#55684a'], [0.25, '#3d4d38'], [1, '#1d261d']]));
      g.rect(0, 604, WRAP, 52).fill(lin([[0, '#8d8a76'], [1, '#5a5a4c']]));
      for (let i = 0; i < 46; i++) {
        const x = (i / 46) * WRAP + r() * 10;
        const w = 30 + r() * 16;
        g.roundRect(x, 606 + r() * 4, w, 18 + r() * 10, 6).fill({ color: '#a29e88', alpha: 0.35 + r() * 0.3 }).stroke({ width: 1, color: '#3a3a30', alpha: 0.4 });
      }
      for (let i = 0; i < 260; i++) {
        const x = r() * WRAP;
        const y = 598 + (r() < 0.5 ? 0 : 58) + r() * 8;
        const h = 6 + r() * 14;
        g.moveTo(x, y).quadraticCurveTo(x + (r() - 0.5) * 6, y - h * 0.6, x + (r() - 0.5) * 10, y - h).stroke({ width: 1.2, color: r() < 0.5 ? '#6f8f52' : '#4c6b3c', alpha: 0.9 });
      }
    }, 41);

    this.rays.blendMode = 'add';
    this.view.addChild(this.rays);
    this.view.addChild(this.leafLayer);

    // foreground stalks (closer than the character, drawn later by the scene)
    const leafG = new Graphics();
    leafG.moveTo(0, -10).quadraticCurveTo(5, 0, 0, 12).quadraticCurveTo(-5, 0, 0, -10).fill('#ffffff');
    leafG.moveTo(0, -9).lineTo(0, 11).stroke({ width: 0.8, color: '#000000', alpha: 0.25 });
    const leafTex: Texture = renderer.generateTexture({ target: leafG, resolution: 3 });
    const r = rng(77);
    for (let i = 0; i < 46; i++) {
      const s = new Sprite(leafTex);
      s.anchor.set(0.5);
      const z = 0.4 + r() * 1;
      s.scale.set(z * 0.9);
      s.tint = [0x8fb36a, 0x6f9a52, 0xb7c97a, 0x5d8448][i % 4];
      s.alpha = 0.55 + z * 0.3;
      s.x = r() * 1600;
      s.y = r() * 720;
      this.leaves.push({ s, vx: -12 - r() * 20, vy: 26 + r() * 30, spin: (r() - 0.5) * 4, phase: r() * 10, z });
      this.leafLayer.addChild(s);
    }
  }

  front(): Container {
    const c = new Container();
    const r = rng(99);
    for (let k = 0; k < 2; k++) {
      const g = new Graphics();
      for (let i = 0; i < 4; i++) bamboo(g, 200 + i * 460 + r() * 120, -80, 760, 30 + r() * 14, (r() - 0.5) * 30, ['#1f3523', '#152818', '#0b170d'], '#2f4d33', false, r);
      g.x = k * WRAP;
      c.addChild(g);
    }
    this.layers.push({ view: c, factor: 1.6 });
    return c;
  }

  update(dt: number, speed: number): void {
    this.time += dt;
    this.scroll += speed * dt;
    for (const l of this.layers) {
      const off = (this.scroll * l.factor) % WRAP;
      l.view.x = -off;
    }
    const g = this.rays.clear();
    for (let i = 0; i < 5; i++) {
      const x = 700 + i * 120 + Math.sin(this.time * 0.3 + i) * 30;
      const a = 0.05 + 0.03 * Math.sin(this.time * 0.5 + i * 1.7);
      g.poly([x, -20, x + 60, -20, x - 260, 720, x - 420, 720]).fill({ color: '#fff3c4', alpha: a });
    }
    for (const L of this.leaves) {
      L.phase += dt;
      L.s.x += (L.vx - speed * L.z * 0.8 + Math.sin(L.phase * 1.3) * 18) * dt * L.z;
      L.s.y += L.vy * dt * L.z;
      L.s.rotation += L.spin * dt;
      L.s.scale.x = L.z * 0.9 * Math.cos(L.phase * 2.2);
      if (L.s.y > 740) {
        L.s.y = -20;
        L.s.x = Math.random() * (this.width + 200);
      }
      if (L.s.x < -40) L.s.x += this.width + 80;
      if (L.s.x > this.width + 40) L.s.x -= this.width + 80;
    }
  }
}
