import { useCallback, useEffect, useState } from 'react';

export type EmojiSet = {
  id: string;
  name: string;
  logo: string;
  noun: string;
  emojis: string[];
  builtin: boolean;
};

export const BUILTIN_SETS: EmojiSet[] = [
  {
    id: 'fruit',
    name: 'Fruit',
    logo: '🍊',
    noun: 'fruit',
    emojis: ['🍎', '🍋', '🍉', '🍓', '🍇', '🍑'],
    builtin: true,
  },
  {
    id: 'animals',
    name: 'Animals',
    logo: '🐸',
    noun: 'creature',
    emojis: ['🐶', '🐱', '🦊', '🐰', '🐻', '🐼'],
    builtin: true,
  },
  {
    id: 'weather',
    name: 'Weather',
    logo: '🌞',
    noun: 'sky thing',
    emojis: ['☀️', '🌧️', '⛈️', '🌈', '❄️', '⭐'],
    builtin: true,
  },
  {
    id: 'party',
    name: 'Party',
    logo: '🎈',
    noun: 'treat',
    emojis: ['🎈', '🎁', '🎂', '🎉', '🎀', '🍭'],
    builtin: true,
  },
  {
    id: 'gross',
    name: 'Gross',
    logo: '🤮',
    noun: 'gross thing',
    emojis: ['🚽', '💩', '🪱', '🪳', '🤮', '🐀'],
    builtin: true,
  },
];

const KEY = 'ep:customSets';

type CustomSetInput = { name: string; emojis: string[] };

function loadCustomSets(): EmojiSet[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EmojiSet[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => s && typeof s.id === 'string' && Array.isArray(s.emojis));
  } catch {
    return [];
  }
}

function persistCustomSets(sets: EmojiSet[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sets));
  } catch {
    // ignore
  }
}

function makeId() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function useCustomSets(): {
  customSets: EmojiSet[];
  allSets: EmojiSet[];
  createSet: (input: CustomSetInput) => string;
  deleteSet: (id: string) => void;
  getSet: (id: string) => EmojiSet | undefined;
} {
  const [customSets, setCustomSets] = useState<EmojiSet[]>(loadCustomSets);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setCustomSets(loadCustomSets());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const createSet = useCallback((input: CustomSetInput) => {
    const id = makeId();
    const set: EmojiSet = {
      id,
      name: input.name.trim() || 'My set',
      logo: input.emojis[0] ?? '✨',
      noun: input.name.trim().toLowerCase() || 'thing',
      emojis: input.emojis,
      builtin: false,
    };
    setCustomSets((prev) => {
      const next = [...prev, set];
      persistCustomSets(next);
      return next;
    });
    return id;
  }, []);

  const deleteSet = useCallback((id: string) => {
    setCustomSets((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistCustomSets(next);
      return next;
    });
  }, []);

  const allSets = [...BUILTIN_SETS, ...customSets];
  const getSet = useCallback(
    (id: string) => allSets.find((s) => s.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customSets],
  );

  return { customSets, allSets, createSet, deleteSet, getSet };
}
