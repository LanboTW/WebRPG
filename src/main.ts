import { Application, Container, Sprite, Texture } from 'pixi.js';
import { Swordswoman } from './character/swordswoman';
import { HEADGEAR, OUTFITS, WEAPONS, type Loadout } from './character/equipment';
import { Backdrop } from './showcase/backdrop';
import { buildUI, type Quality } from './showcase/ui';
import { Sparks } from './fx/sparks';
import { t } from './i18n';

const VIEW_H = 720;
const GROUND_Y = 630;

const views = {
  full: { zoom: 1, focusY: -190 },
  half: { zoom: 1.9, focusY: -250 },
  face: { zoom: 4.6, focusY: -318 },
};
type ViewName = keyof typeof views;

function pickQuality(): Quality {
  const saved = localStorage.getItem('webrpg.quality') as Quality | null;
  if (saved === 'high' || saved === 'medium' || saved === 'low') return saved;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mobile = matchMedia('(pointer: coarse)').matches;
  if (mem <= 3 || cores <= 4) return 'low';
  if (mobile) return 'medium';
  return 'high';
}

function resolutionFor(q: Quality): number {
  const dpr = window.devicePixelRatio || 1;
  return q === 'high' ? Math.min(dpr, 3) : q === 'medium' ? Math.min(dpr, 2) : Math.min(dpr, 1.25);
}

function makeVignette(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 70, 128, 128, 182);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return Texture.from(c);
}

async function main() {
  document.title = `${t('title')} · ${t('subtitle')}`;
  let quality = pickQuality();
  const app = new Application();
  await app.init({
    resizeTo: window,
    antialias: true,
    resolution: resolutionFor(quality),
    autoDensity: true,
    background: '#0e1418',
    powerPreference: 'high-performance',
  });
  document.getElementById('app')!.appendChild(app.canvas);

  const params = new URLSearchParams(location.search);
  const loadout: Loadout = {
    outfit: OUTFITS.find((o) => o.id === params.get('outfit')) ?? OUTFITS[0],
    weapon: WEAPONS.find((o) => o.id === params.get('weapon')) ?? WEAPONS[0],
    headgear: HEADGEAR.find((o) => o.id === params.get('head')) ?? HEADGEAR[0],
  };

  const world = new Container();
  app.stage.addChild(world);
  const backdrop = new Backdrop(app.renderer);
  world.addChild(backdrop.view);

  const hero = new Swordswoman(loadout);
  const actor = new Container();
  actor.addChild(hero.view);
  world.addChild(actor);
  const sparks = new Sparks();
  world.addChild(sparks.view);
  const front = backdrop.front();
  front.alpha = 0.92;
  world.addChild(front);

  const vignette = new Sprite(makeVignette());
  app.stage.addChild(vignette);

  let view: ViewName = (params.get('view') as ViewName) in views ? (params.get('view') as ViewName) : 'full';
  if (params.get('z')) views[view] = { zoom: +params.get('z')!, focusY: +(params.get('fy') ?? views[view].focusY) };
  let zoom = views[view].zoom;
  let focusY = views[view].focusY;
  let facing = 1;
  let shake = 0;
  let speed = 0;
  let running = false;

  hero.onEvent = (name) => {
    if (name === 'hit' || name === 'heavy') {
      const tip = hero.skel.point('sword', 0, hero.loadout.weapon.bladeLen * 0.85);
      sparks.burst(actor.x + tip.x * facing * actor.scale.x, actor.y + tip.y * actor.scale.y, hero.loadout.weapon.glow, name === 'heavy' ? 26 : 12, facing);
      shake = name === 'heavy' ? 1 : 0.35;
    }
  };

  const layout = () => {
    const w = app.screen.width;
    const h = app.screen.height;
    const base = h / VIEW_H;
    backdrop.width = w / base;
    vignette.width = w;
    vignette.height = h;
  };
  layout();
  window.addEventListener('resize', layout);

  const setView = (v: ViewName) => {
    view = v;
  };

  const ui = buildUI({
    loadout,
    quality,
    onAnim: (a) => {
      if (a === 'run') {
        running = !running || hero.current !== 'run';
        hero.play(running ? 'run' : 'idle', 0.2);
      } else if (a === 'idle') {
        running = false;
        hero.play('idle', 0.25);
      } else if (a === 'attack') {
        running = false;
        hero.sequence(['attack1', 'attack2', 'attack3'], 'idle');
      } else if (a === 'hurt') {
        hero.sequence(['hurt'], running ? 'run' : 'idle');
        shake = 0.5;
      }
      return running;
    },
    onEquip: (l) => hero.setLoadout(l),
    onView: (v) => setView(v as ViewName),
    onFlip: () => {
      facing *= -1;
    },
    onQuality: (q) => {
      quality = q;
      localStorage.setItem('webrpg.quality', q);
      app.renderer.resolution = resolutionFor(q);
      app.renderer.resize(window.innerWidth, window.innerHeight);
      layout();
    },
  });

  const keys = new Set<string>();
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    keys.add(k);
    if (k === 'j') ui.trigger('attack');
    if (k === 'k') ui.trigger('hurt');
    if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') {
      const dir = k === 'arrowleft' || k === 'a' ? -1 : 1;
      facing = dir;
      if (hero.current === 'idle') {
        running = true;
        hero.play('run', 0.2);
        ui.setRunning(true);
      }
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    keys.delete(k);
    if (['arrowleft', 'a', 'arrowright', 'd'].includes(k) && !['arrowleft', 'a', 'arrowright', 'd'].some((x) => keys.has(x))) {
      if (hero.current === 'run') {
        running = false;
        hero.play('idle', 0.25);
        ui.setRunning(false);
      }
    }
  });

  let curFacing = facing;
  const tick = (dt: number) => {
    const targetSpeed = hero.current === 'run' ? 520 * facing : 0;
    speed += (targetSpeed - speed) * Math.min(1, dt * 6);
    hero.wind.x = -Math.abs(speed) * 1.6 - 60;
    hero.update(dt);
    backdrop.update(dt, speed);
    sparks.update(dt);

    // turn with a quick squash instead of an instant flip
    curFacing += (facing - curFacing) * Math.min(1, dt * 18);
    const w = app.screen.width;
    const h = app.screen.height;
    const base = h / VIEW_H;
    const zt = views[view].zoom;
    zoom += (zt - zoom) * Math.min(1, dt * 5);
    focusY += (views[view].focusY - focusY) * Math.min(1, dt * 5);
    const s = base * zoom;
    front.alpha = 0.92 * Math.max(0, 1 - (zoom - 1) * 1.4);
    front.visible = front.alpha > 0.01;
    world.scale.set(s);
    const charX = (w / base) * (w > h * 1.3 ? 0.42 : 0.5);
    actor.x = charX;
    actor.y = GROUND_Y;
    actor.scale.set(1.28);
    hero.view.scale.x = curFacing;
    // camera: keep the focus point centred vertically when zoomed
    const fy = GROUND_Y + focusY * 1.28;
    const blend = (zoom - 1) / 4.2;
    world.x = w / 2 - charX * s + (charX - w / (2 * base)) * s * Math.max(0, 1 - blend * 3);
    world.y = h / 2 - fy * s;
    if (zoom < 1.05) world.y = 0;
    else world.y = Math.min(0, world.y);
    world.y = Math.max(world.y, h - VIEW_H * s);
    if (shake > 0) {
      shake = Math.max(0, shake - dt * 3);
      world.x += (Math.random() - 0.5) * 14 * shake * base;
      world.y += (Math.random() - 0.5) * 10 * shake * base;
    }
  };
  app.ticker.add((tk) => tick(Math.min(tk.deltaMS / 1000, 1 / 20)));

  if (params.get('anim')) {
    const a = params.get('anim')!;
    if (a === 'attack' || a === 'hurt' || a === 'run') ui.trigger(a);
    if (a.startsWith('freeze')) hero.anim.speed = 0;
  }
  // debug hooks: advance the simulation by hand (rAF pauses in hidden tabs)
  Object.assign(window, {
    hero,
    ui,
    advance(sec: number) {
      app.ticker.stop();
      for (let i = 0; i < Math.round(sec * 60); i++) tick(1 / 60);
      app.render();
    },
    resume: () => app.ticker.start(),
  });
}

main();
