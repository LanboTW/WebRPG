import { Container, Matrix } from 'pixi.js';
import type { Pt } from './draw';

export interface BoneDef {
  name: string;
  parent?: string;
  x: number;
  y: number;
  rot?: number; // degrees
}

/** Offsets an animation applies on top of a bone's rest pose. rot in degrees. */
export interface BoneOffset {
  rot: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
}

export type Pose = Record<string, BoneOffset>;

export function emptyOffset(): BoneOffset {
  return { rot: 0, x: 0, y: 0, sx: 1, sy: 1 };
}

export class Bone {
  readonly local = new Matrix();
  readonly world = new Matrix();
  rot = 0;
  x = 0;
  y = 0;
  sx = 1;
  sy = 1;
  constructor(
    readonly name: string,
    readonly parent: Bone | null,
    readonly restX: number,
    readonly restY: number,
    readonly restRot: number,
  ) {}

  /** World-space angle (radians) of the bone's +y axis, using the bone convention dir = (-sin a, cos a). */
  get worldAngle(): number {
    const m = this.world;
    return Math.atan2(-m.c, m.d);
  }
}

/** A minimal Spine-like skeleton: bones in parent-first order, world matrices computed in character space. */
export class Skeleton {
  readonly bones: Bone[] = [];
  readonly map = new Map<string, Bone>();

  constructor(defs: BoneDef[]) {
    for (const d of defs) {
      const parent = d.parent ? this.map.get(d.parent)! : null;
      const b = new Bone(d.name, parent, d.x, d.y, d.rot ?? 0);
      this.bones.push(b);
      this.map.set(d.name, b);
    }
  }

  get(name: string): Bone {
    const b = this.map.get(name);
    if (!b) throw new Error(`bone ${name}`);
    return b;
  }

  apply(pose: Pose): void {
    for (const b of this.bones) {
      const o = pose[b.name];
      b.x = b.restX + (o ? o.x : 0);
      b.y = b.restY + (o ? o.y : 0);
      b.rot = b.restRot + (o ? o.rot : 0);
      b.sx = o ? o.sx : 1;
      b.sy = o ? o.sy : 1;
    }
  }

  update(): void {
    for (const b of this.bones) {
      const r = (b.rot * Math.PI) / 180;
      const c = Math.cos(r);
      const s = Math.sin(r);
      b.local.set(c * b.sx, s * b.sx, -s * b.sy, c * b.sy, b.x, b.y);
      if (b.parent) b.world.copyFrom(b.parent.world).append(b.local);
      else b.world.copyFrom(b.local);
    }
  }

  point(name: string, lx: number, ly: number, out: Pt = { x: 0, y: 0 }): Pt {
    const m = this.get(name).world;
    out.x = m.a * lx + m.c * ly + m.tx;
    out.y = m.b * lx + m.d * ly + m.ty;
    return out;
  }
}

/** A draw slot: a display object that follows a bone's world transform. */
export class Slot {
  constructor(
    readonly bone: Bone,
    readonly view: Container,
  ) {}

  sync(): void {
    this.view.setFromMatrix(this.bone.world);
  }
}
