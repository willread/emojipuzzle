export type EmojiSetKey = 'fruit' | 'animals' | 'weather' | 'party' | 'gross';
export type Difficulty = 1 | 2 | 3;

export type Part =
  | { kind: 'op'; val: '+' | '×' | '−' }
  | { kind: 'emoji'; val: string };

export type Row = { parts: Part[]; answer: number };

export type Puzzle = {
  emojis: Record<string, number>;
  emojiOrder: [string, string, string];
  rows: Row[];
  finalRow: Row;
  seed: number;
};

export const EMOJI_SETS: Record<EmojiSetKey, string[]> = {
  fruit:   ['🍎', '🍋', '🍉', '🍓', '🍇', '🍑'],
  animals: ['🐶', '🐱', '🦊', '🐰', '🐻', '🐼'],
  weather: ['☀️', '🌧️', '⛈️', '🌈', '❄️', '⭐'],
  party:   ['🎈', '🎁', '🎂', '🎉', '🎀', '🍭'],
  gross:   ['🚽', '💩', '🪱', '🪳', '🤮', '🐀'],
};

export const LOGO_EMOJI: Record<EmojiSetKey, string> = {
  fruit:   '🍊',
  animals: '🐸',
  weather: '🌞',
  party:   '🎈',
  gross:   '🤮',
};

export const SET_NOUN: Record<EmojiSetKey, string> = {
  fruit:   'fruit',
  animals: 'creature',
  weather: 'sky thing',
  party:   'treat',
  gross:   'gross thing',
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function generatePuzzle(setKey: EmojiSetKey = 'fruit', difficulty: Difficulty = 2): Puzzle {
  const pool = shuffle(EMOJI_SETS[setKey]).slice(0, 3) as [string, string, string];
  const [A, B, C] = pool;

  const maxVal = difficulty === 1 ? 6 : difficulty === 2 ? 9 : 12;
  const a = rand(2, maxVal);
  const b = rand(2, maxVal);
  const c = rand(1, Math.max(3, maxVal - 4));

  const n1 = difficulty === 1 ? 3 : 4;
  const n2 = difficulty === 1 ? 4 : 5;

  const row1Parts: Part[] = [];
  for (let i = 0; i < n1; i++) {
    if (i > 0) row1Parts.push({ kind: 'op', val: '+' });
    row1Parts.push({ kind: 'emoji', val: A });
  }
  const row1: Row = { parts: row1Parts, answer: a * n1 };

  const row2Parts: Part[] = [{ kind: 'emoji', val: A }];
  for (let i = 0; i < n2 - 1; i++) {
    row2Parts.push({ kind: 'op', val: '+' });
    row2Parts.push({ kind: 'emoji', val: B });
  }
  const row2: Row = { parts: row2Parts, answer: a + (n2 - 1) * b };

  const row3: Row = {
    parts: [
      { kind: 'emoji', val: B },
      { kind: 'op', val: '+' },
      { kind: 'emoji', val: C },
    ],
    answer: b + c,
  };

  const useMul = difficulty >= 2;
  const finalParts: Part[] = useMul
    ? [
        { kind: 'emoji', val: C },
        { kind: 'op', val: '+' },
        { kind: 'emoji', val: B },
        { kind: 'op', val: '×' },
        { kind: 'emoji', val: A },
      ]
    : [
        { kind: 'emoji', val: C },
        { kind: 'op', val: '+' },
        { kind: 'emoji', val: B },
        { kind: 'op', val: '+' },
        { kind: 'emoji', val: A },
      ];
  const finalAnswer = useMul ? c + b * a : c + b + a;

  return {
    emojis: { [A]: a, [B]: b, [C]: c },
    emojiOrder: [A, B, C],
    rows: [row1, row2, row3],
    finalRow: { parts: finalParts, answer: finalAnswer },
    seed: Date.now(),
  };
}
