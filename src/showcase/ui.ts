import { HEADGEAR, OUTFITS, WEAPONS, type Loadout } from '../character/equipment';
import { t } from '../i18n';

export type Quality = 'high' | 'medium' | 'low';
type Anim = 'idle' | 'run' | 'attack' | 'hurt';

interface UIOptions {
  loadout: Loadout;
  quality: Quality;
  onAnim(a: Anim): boolean;
  onEquip(l: Loadout): void;
  onView(v: string): void;
  onFlip(): void;
  onQuality(q: Quality): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function buildUI(o: UIOptions) {
  const root = el('div', 'ui');
  const head = el('header', 'ui-title');
  head.append(el('h1', '', t('title')), el('p', '', t('subtitle')));
  document.body.append(head);

  const panel = el('aside', 'panel');
  const toggle = el('button', 'panel-toggle', t('panel.toggle'));
  toggle.onclick = () => panel.classList.toggle('collapsed');
  if (matchMedia('(max-height: 500px)').matches) panel.classList.add('collapsed');

  const loadout = { ...o.loadout };
  const animButtons = new Map<Anim, HTMLButtonElement>();

  const section = (title: string) => {
    const s = el('section');
    s.append(el('h2', '', title));
    const row = el('div', 'chips');
    s.append(row);
    panel.append(s);
    return row;
  };

  const animRow = section(t('section.anim'));
  for (const a of ['idle', 'run', 'attack', 'hurt'] as Anim[]) {
    const b = el('button', 'chip', t(`anim.${a}`));
    b.onclick = () => trigger(a);
    animRow.append(b);
    animButtons.set(a, b);
  }

  const setRunning = (r: boolean) => {
    animButtons.get('run')!.classList.toggle('on', r);
    animButtons.get('idle')!.classList.toggle('on', !r);
  };
  const trigger = (a: Anim) => {
    const running = o.onAnim(a);
    setRunning(running);
  };
  setRunning(false);

  const equipRow = <T extends { id: string }>(title: string, items: T[], key: keyof Loadout, prefix: string) => {
    const row = section(title);
    const buttons: HTMLButtonElement[] = [];
    for (const it of items) {
      const b = el('button', 'chip', t(`${prefix}.${it.id}`));
      b.onclick = () => {
        (loadout as Record<keyof Loadout, unknown>)[key] = it;
        buttons.forEach((x) => x.classList.toggle('on', x === b));
        o.onEquip({ ...loadout });
      };
      if ((loadout[key] as { id: string }).id === it.id) b.classList.add('on');
      buttons.push(b);
      row.append(b);
    }
  };
  equipRow(t('section.outfit'), OUTFITS, 'outfit', 'outfit');
  equipRow(t('section.weapon'), WEAPONS, 'weapon', 'weapon');
  equipRow(t('section.headgear'), HEADGEAR, 'headgear', 'headgear');

  const viewRow = section(t('section.view'));
  const viewButtons: HTMLButtonElement[] = [];
  for (const v of ['full', 'half', 'face']) {
    const b = el('button', 'chip', t(`view.${v}`));
    b.onclick = () => {
      o.onView(v);
      viewButtons.forEach((x) => x.classList.toggle('on', x === b));
    };
    if (v === 'full') b.classList.add('on');
    viewButtons.push(b);
    viewRow.append(b);
  }
  const flip = el('button', 'chip', t('view.flip'));
  flip.onclick = () => o.onFlip();
  viewRow.append(flip);

  const qRow = section(t('quality.label'));
  const qButtons: HTMLButtonElement[] = [];
  for (const q of ['high', 'medium', 'low'] as Quality[]) {
    const b = el('button', 'chip', t(`quality.${q}`));
    b.onclick = () => {
      o.onQuality(q);
      qButtons.forEach((x) => x.classList.toggle('on', x === b));
    };
    if (q === o.quality) b.classList.add('on');
    qButtons.push(b);
    qRow.append(b);
  }

  const hint = el('p', 'hint', t('hint.keys'));
  panel.append(hint);

  const rotate = el('div', 'rotate-hint');
  rotate.append(el('div', 'phone'), el('p', '', t('rotate.hint')));

  root.append(panel, toggle);
  document.body.append(root, rotate);

  return { trigger, setRunning };
}
