/** Equipment data. Every visual part reads its colours/features from here, so swapping gear changes the look. */

export interface OutfitDef {
  id: string;
  robe: [string, string, string]; // light, base, shade
  robeLine: string;
  trim: string;
  trimLight: string;
  inner: [string, string];
  sash: [string, string];
  sashGem: string;
  ribbon: [string, string];
  pants: [string, string];
  boots: [string, string];
  bootTrim: string;
  embroidery: string;
  /** feature flags */
  pauldron: boolean;
  bracers: boolean;
  sleeveWidth: number; // 1 = wide flowing sleeves
  robeLength: number; // 1 = mid-shin
  pattern: 'cloud' | 'flame' | 'none';
}

export interface WeaponDef {
  id: string;
  blade: [string, string, string]; // edge light, mid, spine dark
  bladeLen: number;
  bladeWidth: number;
  guard: [string, string];
  grip: [string, string];
  tassel: [string, string];
  glow: string; // trail / qi colour
  glowCore: string;
  guardStyle: 'cloud' | 'beast' | 'crescent';
}

export interface HeadgearDef {
  id: string;
  kind: 'ribbon' | 'jadepin' | 'phoenix';
  main: [string, string];
  accent: string;
}

export const OUTFITS: OutfitDef[] = [
  {
    id: 'qinglan',
    robe: ['#f4f7f2', '#dfe8e3', '#9fb5b2'],
    robeLine: '#55706f',
    trim: '#2c6f72',
    trimLight: '#5fa8a6',
    inner: ['#fbf8f2', '#d9d2c6'],
    sash: ['#3d6c76', '#1f3c45'],
    sashGem: '#7fd6c0',
    ribbon: ['#7cc4c0', '#3c8c8f'],
    pants: ['#4a5560', '#2b323b'],
    boots: ['#3a302b', '#1d1715'],
    bootTrim: '#8a7558',
    embroidery: '#c3a76a',
    pauldron: false,
    bracers: false,
    sleeveWidth: 1,
    robeLength: 1,
    pattern: 'cloud',
  },
  {
    id: 'chixia',
    robe: ['#e65a4f', '#b8302e', '#6e1820'],
    robeLine: '#3f0c12',
    trim: '#d7a645',
    trimLight: '#ffe08a',
    inner: ['#f7efe2', '#cdbba4'],
    sash: ['#2a2224', '#120d0e'],
    sashGem: '#ffcc55',
    ribbon: ['#f2c25a', '#b07d22'],
    pants: ['#3b2b2b', '#1e1416'],
    boots: ['#2a1d1a', '#120c0b'],
    bootTrim: '#d7a645',
    embroidery: '#f3cf72',
    pauldron: true,
    bracers: true,
    sleeveWidth: 0.75,
    robeLength: 0.92,
    pattern: 'flame',
  },
  {
    id: 'xuanye',
    robe: ['#4b4766', '#2a2840', '#13121f'],
    robeLine: '#08070e',
    trim: '#a9b4cf',
    trimLight: '#e7ecff',
    inner: ['#3b3d52', '#20212d'],
    sash: ['#6b4f9a', '#3a2760'],
    sashGem: '#c9a8ff',
    ribbon: ['#9b7ad6', '#57379a'],
    pants: ['#24232f', '#121118'],
    boots: ['#1c1b22', '#0b0a0f'],
    bootTrim: '#a9b4cf',
    embroidery: '#b9a6e8',
    pauldron: false,
    bracers: true,
    sleeveWidth: 0.45,
    robeLength: 0.82,
    pattern: 'none',
  },
];

export const WEAPONS: WeaponDef[] = [
  {
    id: 'qingfeng',
    blade: ['#ffffff', '#d8e2ea', '#7f8fa0'],
    bladeLen: 128,
    bladeWidth: 6,
    guard: ['#c9d6d4', '#5f7a78'],
    grip: ['#3f5f61', '#1d3133'],
    tassel: ['#6fc7bd', '#2f7f79'],
    glow: '#7fe3d6',
    glowCore: '#eafffb',
    guardStyle: 'cloud',
  },
  {
    id: 'chixiao',
    blade: ['#fff2e6', '#e9c9b8', '#8c5a4a'],
    bladeLen: 136,
    bladeWidth: 7.5,
    guard: ['#ffe08a', '#a8741f'],
    grip: ['#7a1f1f', '#3a0c0e'],
    tassel: ['#ff6a4a', '#9e1e16'],
    glow: '#ff7a3a',
    glowCore: '#fff0c8',
    guardStyle: 'beast',
  },
  {
    id: 'hanshuang',
    blade: ['#ffffff', '#bfe6ff', '#5f8fc2'],
    bladeLen: 132,
    bladeWidth: 6.5,
    guard: ['#e8f4ff', '#6f8fb8'],
    grip: ['#2d3d66', '#141c33'],
    tassel: ['#a8d8ff', '#4a7fc0'],
    glow: '#8fd0ff',
    glowCore: '#f0fbff',
    guardStyle: 'crescent',
  },
];

export const HEADGEAR: HeadgearDef[] = [
  { id: 'ribbon', kind: 'ribbon', main: ['#7cc4c0', '#3c8c8f'], accent: '#e8f6f2' },
  { id: 'jadepin', kind: 'jadepin', main: ['#9fe3c3', '#3f9a78'], accent: '#e8c77a' },
  { id: 'phoenix', kind: 'phoenix', main: ['#ffe39a', '#b8862a'], accent: '#e8484a' },
];

export interface Loadout {
  outfit: OutfitDef;
  weapon: WeaponDef;
  headgear: HeadgearDef;
}
