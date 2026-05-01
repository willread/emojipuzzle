export type Difficulty = 1 | 2 | 3 | 4;

export type Op = '+' | '−' | '×' | '÷';

export type Part =
  | { kind: 'op'; val: Op }
  | { kind: 'paren'; val: '(' | ')' }
  | { kind: 'emoji'; val: string }
  | { kind: 'pow'; val: string; exp: number }
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
const pow = (val: string, exp: number): Part => ({ kind: 'pow', val, exp });
const paren = (val: '(' | ')'): Part => ({ kind: 'paren', val });

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
function coin() {
  return Math.random() < 0.5;
}

// Pure addition row: counts[i] copies of emojis[i], joined by '+'.
function additionRow(emojis: string[], counts: number[], values: Record<string, number>): Row {
  const parts: Part[] = [];
  let answer = 0;
  emojis.forEach((em, i) => {
    for (let j = 0; j < counts[i]; j++) {
      if (parts.length > 0) parts.push(op('+'));
      parts.push(e(em));
    }
    answer += counts[i] * values[em];
  });
  return { parts, answer };
}

// "Final" row using all three emojis with some operator pattern.
function buildFinal(
  emojis: [string, string, string],
  values: Record<string, number>,
  difficulty: Difficulty,
): Row {
  const [a, b, c] = emojis; // these are *not* sorted by solve order — we shuffle below
  const shuffled = shuffle([a, b, c]) as [string, string, string];
  const [x, y, z] = shuffled;

  if (difficulty === 1) {
    // Easy: pure sum of all three (sometimes one repeated for variety)
    const repeat = Math.random() < 0.25 ? pick(shuffled) : null;
    const seq = repeat ? [x, y, z, repeat] : [x, y, z];
    const parts: Part[] = [];
    seq.forEach((em, i) => {
      if (i > 0) parts.push(op('+'));
      parts.push(e(em));
    });
    return { parts, answer: seq.reduce((s, em) => s + values[em], 0) };
  }

  if (difficulty === 2) {
    // Medium: one × somewhere, sometimes a stack
    const useStack = Math.random() < 0.35;
    const stackCount = useStack ? rand(2, 3) : 0;
    // Patterns: X + Y × Z   |   X × Y + Z   |   Z + group(Y, n) × X (medium stacking)
    const pattern = pick(['add-mul', 'mul-add', 'sub-mul']);
    if (useStack && pattern === 'sub-mul' && values[x] >= values[y]) {
      // X − group(Y, n) × Z  (subtraction at front)
      return {
        parts: [e(x), op('−'), g(y, stackCount), op('×'), e(z)],
        answer: values[x] - stackCount * values[y] * values[z],
      };
    }
    if (pattern === 'add-mul') {
      // X + Y × Z
      return {
        parts: [e(x), op('+'), e(y), op('×'), e(z)],
        answer: values[x] + values[y] * values[z],
      };
    }
    // mul-add: X × Y + Z
    return {
      parts: [e(x), op('×'), e(y), op('+'), e(z)],
      answer: values[x] * values[y] + values[z],
    };
  }

  if (difficulty === 3) {
    // Hard: stacked group + multiplication, possibly a third operand
    const stackCount = rand(2, 3);
    const stackEmoji = y;
    const pattern = pick(['c-stack-mul-a', 'stack-mul-a-add-c', 'a-add-stack-mul-c']);
    if (pattern === 'c-stack-mul-a') {
      // X + group(Y, n) × Z
      return {
        parts: [e(x), op('+'), g(stackEmoji, stackCount), op('×'), e(z)],
        answer: values[x] + stackCount * values[stackEmoji] * values[z],
      };
    }
    if (pattern === 'stack-mul-a-add-c') {
      // group(Y, n) × X + Z
      return {
        parts: [g(stackEmoji, stackCount), op('×'), e(x), op('+'), e(z)],
        answer: stackCount * values[stackEmoji] * values[x] + values[z],
      };
    }
    // a-add-stack-mul-c: X + group(Y, n) × Z
    return {
      parts: [e(x), op('−'), g(stackEmoji, stackCount), op('×'), e(z)],
      answer: values[x] - stackCount * values[stackEmoji] * values[z],
    };
  }

  // Expert: any of exponent, parens, stacking, multiplication
  const stackCount = rand(2, 3);
  const expert = pick(['pow-mul-stack', 'pow-add-stack', 'paren-mul', 'pow-sub-mul']);
  if (expert === 'pow-mul-stack') {
    // X² − Y × group(Z, n)
    return {
      parts: [pow(x, 2), op('−'), e(y), op('×'), g(z, stackCount)],
      answer: values[x] ** 2 - values[y] * stackCount * values[z],
    };
  }
  if (expert === 'pow-add-stack') {
    // X² + group(Y, n) − Z
    return {
      parts: [pow(x, 2), op('+'), g(y, stackCount), op('−'), e(z)],
      answer: values[x] ** 2 + stackCount * values[y] - values[z],
    };
  }
  if (expert === 'paren-mul') {
    // (X + Y) × Z − group(X, n) ?  Use parens with multiplication outside
    return {
      parts: [paren('('), e(x), op('+'), e(y), paren(')'), op('×'), e(z)],
      answer: (values[x] + values[y]) * values[z],
    };
  }
  // pow-sub-mul: Y² ÷ Z − group(X, n)
  // need Y² divisible by Z
  if (values[y] ** 2 % values[z] === 0) {
    return {
      parts: [pow(y, 2), op('÷'), e(z), op('−'), g(x, stackCount)],
      answer: values[y] ** 2 / values[z] - stackCount * values[x],
    };
  }
  // fallback if the divisibility didn't work
  return {
    parts: [pow(x, 2), op('−'), e(y), op('×'), g(z, stackCount)],
    answer: values[x] ** 2 - values[y] * stackCount * values[z],
  };
}

export function generatePuzzle(emojiPool: string[], difficulty: Difficulty = 2): Puzzle {
  const pool = shuffle(emojiPool).slice(0, 3) as [string, string, string];
  if (difficulty === 1) return easyPuzzle(pool);
  if (difficulty === 2) return mediumPuzzle(pool);
  if (difficulty === 3) return hardPuzzle(pool);
  return expertPuzzle(pool);
}

// ───── Easy ─────
// Pure addition. Random solve order, random counts, random partner for row 3,
// random final shape. Small numbers, no stacking, no negatives.
function easyPuzzle(pool: [string, string, string]): Puzzle {
  const [v1, v2, v3] = shuffle(pool) as [string, string, string];
  const values: Record<string, number> = {
    [v1]: rand(2, 6),
    [v2]: rand(2, 6),
    [v3]: rand(1, 5),
  };

  const n1 = rand(2, 4); // pure single-var row
  const n2 = rand(2, 3); // mixed row, count of v2

  // row 3 partners v3 with v1 or v2
  const partner = coin() ? v1 : v2;
  const np = coin() ? 1 : 2;
  const nt = coin() ? 1 : 2;

  return {
    emojis: { [pool[0]]: values[pool[0]], [pool[1]]: values[pool[1]], [pool[2]]: values[pool[2]] },
    emojiOrder: [v1, v2, v3],
    rows: [
      additionRow([v1], [n1], values),
      additionRow([v1, v2], [1, n2], values),
      additionRow([partner, v3], [np, nt], values),
    ],
    finalRow: buildFinal(pool, values, 1),
    seed: Date.now(),
  };
}

// ───── Medium ─────
// Stacked groups, subtraction, multiplication in final.
function mediumPuzzle(pool: [string, string, string]): Puzzle {
  const [v1, v2, v3] = shuffle(pool) as [string, string, string];
  const v1Val = rand(2, 9);
  const v2Val = rand(2, 9);
  // v3 stays small enough to keep optional v2 − v3 positive.
  const v3Val = rand(1, Math.max(1, v2Val - 1));
  const values: Record<string, number> = { [v1]: v1Val, [v2]: v2Val, [v3]: v3Val };

  const n1 = rand(3, 4);
  // Row 2 uses a stacked group of one variable + another singleton
  const stackEmoji = coin() ? v2 : v1; // stack v2 (typical) or sometimes v1
  const stackCount = rand(2, 4);
  const singleton = stackEmoji === v2 ? v1 : v2;

  // Row 3: subtraction or addition between v_part and v3, in either order
  const useSub = coin() && values[v2] > values[v3];
  const row3Partner = coin() ? v1 : v2;
  let row3: Row;
  if (useSub) {
    // ensure positive
    const big = values[row3Partner] >= values[v3] ? row3Partner : v3;
    const small = big === row3Partner ? v3 : row3Partner;
    row3 = {
      parts: [e(big), op('−'), e(small)],
      answer: values[big] - values[small],
    };
  } else {
    row3 = additionRow([row3Partner, v3], [1, 1], values);
  }

  return {
    emojis: { [pool[0]]: values[pool[0]], [pool[1]]: values[pool[1]], [pool[2]]: values[pool[2]] },
    emojiOrder: [v1, v2, v3],
    rows: [
      additionRow([v1], [n1], values),
      // row 2: singleton + stack
      coin()
        ? {
            parts: [e(singleton), op('+'), g(stackEmoji, stackCount)],
            answer: values[singleton] + stackCount * values[stackEmoji],
          }
        : {
            parts: [g(stackEmoji, stackCount), op('+'), e(singleton)],
            answer: stackCount * values[stackEmoji] + values[singleton],
          },
      row3,
    ],
    finalRow: buildFinal(pool, values, 2),
    seed: Date.now(),
  };
}

// ───── Hard ─────
// All four operators, count-mismatch stacking, negative results allowed.
function hardPuzzle(pool: [string, string, string]): Puzzle {
  const [v1, v2, v3] = shuffle(pool) as [string, string, string];
  // We make v1 a multiple of v2 in some shapes (for division)
  const baseV2 = rand(2, 4);
  const k = rand(3, 6);
  const v1Val = baseV2 * k; // divisible by v2
  const v2Val = baseV2;
  const v3Val = rand(1, 9);
  const values: Record<string, number> = { [v1]: v1Val, [v2]: v2Val, [v3]: v3Val };

  // Row 1: pure addition for v2 (small) — count varies
  const n1 = rand(3, 5);
  const row1 = additionRow([v2], [n1], values);

  // Row 2: random of [division v1÷v2, multiplication v2×k, mixed singleton+stack]
  const row2Mode = pick(['div', 'mul', 'mixed']);
  let row2: Row;
  if (row2Mode === 'div') {
    row2 = { parts: [e(v1), op('÷'), e(v2)], answer: k };
  } else if (row2Mode === 'mul') {
    row2 = { parts: [e(v1), op('×'), e(v2)], answer: values[v1] * values[v2] };
  } else {
    const stackCount = rand(2, 3);
    row2 = {
      parts: [e(v1), op('+'), g(v2, stackCount)],
      answer: values[v1] + stackCount * values[v2],
    };
  }

  // Row 3: stacked group of v2 (count 2 or 3) ± v3 — answer can go negative
  const stackC = rand(2, 3);
  const sub = coin();
  const row3 = sub
    ? {
        parts: [g(v2, stackC), op('−'), e(v3)],
        answer: stackC * values[v2] - values[v3],
      }
    : {
        parts: [g(v2, stackC), op('+'), e(v3)],
        answer: stackC * values[v2] + values[v3],
      };

  return {
    emojis: { [pool[0]]: values[pool[0]], [pool[1]]: values[pool[1]], [pool[2]]: values[pool[2]] },
    emojiOrder: [v1, v2, v3],
    rows: [row1, row2, row3],
    finalRow: buildFinal(pool, values, 3),
    seed: Date.now(),
  };
}

// ───── Expert ─────
// Brackets, exponents, larger numbers, full operator mix.
function expertPuzzle(pool: [string, string, string]): Puzzle {
  const [v1, v2, v3] = shuffle(pool) as [string, string, string];
  const baseV2 = rand(2, 5);
  const k = rand(2, 4);
  const v1Val = baseV2 * k; // helps with divisibility
  const v2Val = baseV2;
  const v3Val = rand(2, 5);
  const values: Record<string, number> = { [v1]: v1Val, [v2]: v2Val, [v3]: v3Val };

  // Row 1: small-number single-var addition (establishes v2 cleanly)
  const n1 = rand(3, 4);
  const row1 = additionRow([v2], [n1], values);

  // Row 2: random — exponent intro, division, or stacked
  const row2Mode = pick(['pow-add', 'pow-sub', 'div', 'pow-stack']);
  let row2: Row;
  if (row2Mode === 'pow-add') {
    // v2² + v1 = b² + a → solve v1
    row2 = { parts: [pow(v2, 2), op('+'), e(v1)], answer: values[v2] ** 2 + values[v1] };
  } else if (row2Mode === 'pow-sub') {
    // v1 − v2² = a − b² (might be negative — fine for expert)
    row2 = { parts: [e(v1), op('−'), pow(v2, 2)], answer: values[v1] - values[v2] ** 2 };
  } else if (row2Mode === 'div') {
    row2 = { parts: [e(v1), op('÷'), e(v2)], answer: k };
  } else {
    // pow-stack: v2² + group(v1, n)
    const stackCount = rand(2, 3);
    row2 = {
      parts: [pow(v2, 2), op('+'), g(v1, stackCount)],
      answer: values[v2] ** 2 + stackCount * values[v1],
    };
  }

  // Row 3: parenthesised expression to introduce explicit OOO
  const row3Mode = pick(['paren-mul', 'paren-mul-rev', 'paren-div']);
  let row3: Row;
  if (row3Mode === 'paren-mul') {
    // (v1 − v2) × v3
    row3 = {
      parts: [paren('('), e(v1), op('−'), e(v2), paren(')'), op('×'), e(v3)],
      answer: (values[v1] - values[v2]) * values[v3],
    };
  } else if (row3Mode === 'paren-mul-rev') {
    // v3 × (v1 + v2)
    row3 = {
      parts: [e(v3), op('×'), paren('('), e(v1), op('+'), e(v2), paren(')')],
      answer: values[v3] * (values[v1] + values[v2]),
    };
  } else {
    // paren-div: (v1 + v2) ÷ v3 — only if divisible
    if ((values[v1] + values[v2]) % values[v3] === 0) {
      row3 = {
        parts: [paren('('), e(v1), op('+'), e(v2), paren(')'), op('÷'), e(v3)],
        answer: (values[v1] + values[v2]) / values[v3],
      };
    } else {
      row3 = {
        parts: [paren('('), e(v1), op('−'), e(v2), paren(')'), op('×'), e(v3)],
        answer: (values[v1] - values[v2]) * values[v3],
      };
    }
  }

  return {
    emojis: { [pool[0]]: values[pool[0]], [pool[1]]: values[pool[1]], [pool[2]]: values[pool[2]] },
    emojiOrder: [v1, v2, v3],
    rows: [row1, row2, row3],
    finalRow: buildFinal(pool, values, 4),
    seed: Date.now(),
  };
}
