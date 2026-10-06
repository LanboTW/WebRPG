import { emptyOffset, type BoneOffset, type Pose } from './skeleton';

export type Ease = 'linear' | 'in' | 'out' | 'inout' | 'snap' | 'step' | 'back';

const eases: Record<Ease, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  inout: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  snap: (t) => 1 - (1 - t) ** 5,
  step: (t) => (t < 1 ? 0 : 1),
  back: (t) => {
    const c = 1.9;
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
  },
};

/** [time, value, ease used to arrive at this key] */
export type Key = [number, number, Ease?];
type Channel = 'rot' | 'x' | 'y' | 'sx' | 'sy';
export type Tracks = Record<string, Partial<Record<Channel, Key[]>>>;

export interface ClipEvent {
  t: number;
  name: string;
}

export interface Clip {
  name: string;
  duration: number;
  loop: boolean;
  events?: ClipEvent[];
  sample(t: number, pose: Pose): void;
}

function sampleKeys(keys: Key[], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t <= k[0]) {
      const p = keys[i - 1];
      const u = (t - p[0]) / (k[0] - p[0] || 1);
      return p[1] + (k[1] - p[1]) * eases[k[2] ?? 'inout'](u);
    }
  }
  return keys[keys.length - 1][1];
}

function ensure(pose: Pose, bone: string): BoneOffset {
  return (pose[bone] ??= emptyOffset());
}

export function keyClip(name: string, duration: number, tracks: Tracks, opts: { loop?: boolean; events?: ClipEvent[] } = {}): Clip {
  return {
    name,
    duration,
    loop: opts.loop ?? false,
    events: opts.events,
    sample(t, pose) {
      for (const bone in tracks) {
        const tr = tracks[bone];
        const o = ensure(pose, bone);
        for (const ch in tr) {
          o[ch as Channel] = sampleKeys(tr[ch as Channel]!, t);
        }
      }
    },
  };
}

export function procClip(name: string, duration: number, fn: (t: number, set: (bone: string, rot: number, x?: number, y?: number, sx?: number, sy?: number) => void) => void, loop = true): Clip {
  return {
    name,
    duration,
    loop,
    sample(t, pose) {
      fn(t, (bone, rot, x = 0, y = 0, sx = 1, sy = 1) => {
        const o = ensure(pose, bone);
        o.rot = rot;
        o.x = x;
        o.y = y;
        o.sx = sx;
        o.sy = sy;
      });
    },
  };
}

function resetPose(p: Pose): void {
  for (const k in p) {
    const o = p[k];
    o.rot = 0;
    o.x = 0;
    o.y = 0;
    o.sx = 1;
    o.sy = 1;
  }
}

/** Plays one clip at a time with a crossfade from whatever pose was showing. */
export class Animator {
  clip: Clip | null = null;
  time = 0;
  speed = 1;
  readonly pose: Pose = {};
  private from: Pose = {};
  private cur: Pose = {};
  private fade = 0;
  private fadeDur = 0;
  onEvent?: (name: string) => void;
  onEnd?: (clip: Clip) => void;
  /** channels whose rotation should crossfade along the shortest arc */
  wrapBones = new Set<string>();

  play(clip: Clip, fade = 0.15): void {
    // snapshot current output as the blend source
    this.from = {};
    for (const k in this.pose) this.from[k] = { ...this.pose[k] };
    this.clip = clip;
    this.time = 0;
    this.fadeDur = fade;
    this.fade = fade > 0 ? 0 : 1;
  }

  update(dt: number): void {
    const clip = this.clip;
    if (!clip) return;
    const prev = this.time;
    this.time += dt * this.speed;
    if (clip.events) {
      for (const e of clip.events) {
        if (e.t > prev && e.t <= this.time) this.onEvent?.(e.name);
      }
    }
    let ended = false;
    if (this.time >= clip.duration) {
      if (clip.loop) this.time %= clip.duration;
      else {
        this.time = clip.duration;
        ended = prev < clip.duration;
      }
    }
    resetPose(this.cur);
    clip.sample(this.time, this.cur);

    if (this.fadeDur > 0) this.fade = Math.min(1, this.fade + dt / this.fadeDur);
    const w = this.fade < 1 ? eases.inout(this.fade) : 1;
    resetPose(this.pose);
    const keys = new Set([...Object.keys(this.cur), ...Object.keys(this.from)]);
    for (const k of keys) {
      const a = this.from[k] ?? emptyOffset();
      const b = this.cur[k] ?? emptyOffset();
      const o = ensure(this.pose, k);
      let d = b.rot - a.rot;
      if (this.wrapBones.has(k)) d = ((((d + 180) % 360) + 360) % 360) - 180;
      o.rot = a.rot + d * w;
      o.x = a.x + (b.x - a.x) * w;
      o.y = a.y + (b.y - a.y) * w;
      o.sx = a.sx + (b.sx - a.sx) * w;
      o.sy = a.sy + (b.sy - a.sy) * w;
    }
    if (ended) this.onEnd?.(clip);
  }
}
