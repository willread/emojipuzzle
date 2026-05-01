import { useEffect, useState } from 'react';
import { LOGO_EMOJI, type Difficulty, type EmojiSetKey } from './puzzle';

export type Theme = 'cream' | 'midnight' | 'arcade';

export type Settings = {
  theme: Theme;
  emojiSet: EmojiSetKey;
  difficulty: Difficulty;
  showHints: boolean;
};

const DEFAULTS: Settings = {
  theme: 'cream',
  emojiSet: 'fruit',
  difficulty: 2,
  showHints: true,
};

const KEY = 'ep:settings';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings(): [Settings, <K extends keyof Settings>(key: K, val: Settings[K]) => void] {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    const emoji = LOGO_EMOJI[settings.emojiSet];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;
    const href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [settings.emojiSet]);

  const update = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    setSettings((s) => {
      const next = { ...s, [key]: val };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // localStorage may be unavailable (private mode); ignore
      }
      return next;
    });
  };

  return [settings, update];
}
