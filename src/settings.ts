import { useEffect, useState } from 'react';
import type { Difficulty, EmojiSetKey } from './puzzle';

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
