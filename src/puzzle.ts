export type Difficulty = 1 | 2 | 3;

export type Op = '+' | '−' | '×' | '÷';

export type Part =
  | { kind: 'op'; val: Op }
  | { kind: 'emoji'; val: string }
  | { kind: 'group'; val: string; count: number };

export type Row = { parts: Part[]; answer: number };

export type Puzzle = {
  emojis: Record<string, number>;
  emojiOrder: [string, string, string];
  rows: Row[];
  finalRow: Row;
  seed: number;
};

const e = (val: string): Part => ({ kind: 'emoji', val });
const op = (val: Op): Part => ({ kind: 'op', val });
const g = (val: string, count: number): Part => ({ kind: 'group', val, count });

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function generatePuzzle(emojiPool: string[], difficulty: Difficulty = 2): Puzzle {
  const pool = shuffle(emojiPool).slice(0, 3) as [string, string, string];
  if (difficulty === 1) return easyPuzzle(pool);
  if (difficulty === 2) return mediumPuzzle(pool);
  return hardPuzzle(pool);
}

// ───── Easy: + only, three unknowns, no stacking, no multiplication ─────
function easyPuzzle([A, B, C]: [string, string, string]): Puzzle {
  const a = rand(2, 6);
  const b = rand(2, 6);
  const c = rand(1, 5);
  return {
    emojis: { [A]: a, [B]: b, [C]: c },
    emojiOrder: [A, B, C],
    rows: [
      { parts: [e(A), op('+'), e(A), op('+'), e(A)], answer: 3 * a },
      {
        parts: [e(A), op('+'), e(B), op('+'), e(B), op('+'), e(B)],
        answer: a + 3 * b,
      },
      { parts: [e(B), op('+'), e(C)], answer: b + c },
    ],
    finalRow: {
      parts: [e(C), op('+'), e(B), op('+'), e(A)],
      answer: c + b + a,
    },
    seed: Date.now(),
  };
}

// ───── Medium: stacked groups, +/− on row 3, × in final, all positive ─────
function mediumPuzzle([A, B, C]: [string, string, string]): Puzzle {
  const a = rand(2, 9);
  const b = rand(2, 9);
  const c = rand(1, Math.min(b - 1, 5)); // keep b − c positive
  const useSub = Math.random() < 0.5;
  return {
    emojis: { [A]: a, [B]: b, [C]: c },
    emojiOrder: [A, B, C],
    rows: [
      {
        parts: [e(A), op('+'), e(A), op('+'), e(A), op('+'), e(A)],
        answer: 4 * a,
      },
      {
        parts: [e(A), op('+'), g(B, 3)],
        answer: a + 3 * b,
      },
      useSub
        ? { parts: [e(B), op('−'), e(C)], answer: b - c }
        : { parts: [e(B), op('+'), e(C)], answer: b + c },
    ],
    finalRow: {
      parts: [e(C), op('+'), e(B), op('×'), e(A)],
      answer: c + b * a,
    },
    seed: Date.now(),
  };
}

// ───── Hard: all four ops, division row, count-mismatch stacking, negatives allowed ─────
function hardPuzzle([A, B, C]: [string, string, string]): Puzzle {
  // B kept small so A ÷ B stays a clean small integer; A is a multiple of B.
  const b = rand(2, 4);
  const k = rand(3, 6);
  const a = b * k;
  const c = rand(1, 9);
  // 2b − c is intentionally allowed to be negative to expose the player to a negative answer.

  return {
    emojis: { [A]: a, [B]: b, [C]: c },
    emojiOrder: [A, B, C],
    rows: [
      {
        // Row 1: pure +, establishes B.
        parts: [e(B), op('+'), e(B), op('+'), e(B), op('+'), e(B)],
        answer: 4 * b,
      },
      {
        // Row 2: division — A ÷ B = k. Player solves A = k × B once B is known.
        parts: [e(A), op('÷'), e(B)],
        answer: k,
      },
      {
        // Row 3: stacked group of 2 (mismatch with row 2 of medium-style — intentional).
        // 2b − c may be negative. The player must accept a negative.
        parts: [g(B, 2), op('−'), e(C)],
        answer: 2 * b - c,
      },
    ],
    finalRow: {
      // Final: C + (B B) × A — stacked group of 2 with implicit multiplication precedence.
      parts: [e(C), op('+'), g(B, 2), op('×'), e(A)],
      answer: c + 2 * b * a,
    },
    seed: Date.now(),
  };
}
