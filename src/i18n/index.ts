import zhTW from './zh-TW';

export type MessageKey = keyof typeof zhTW;

const tables: Record<string, Record<string, string>> = { 'zh-TW': zhTW };
let current: Record<string, string> = zhTW;

export function setLocale(locale: string): void {
  current = tables[locale] ?? zhTW;
}

export function t(key: MessageKey | string): string {
  return current[key] ?? key;
}
