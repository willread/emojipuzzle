export type Puzzle = {
  emojis: [string, string, string];
  equations: string[];
  finalExpression: string;
  solution: Record<string, number>;
  answer: number;
};

const EMOJI_POOL = [
  '🍎', '🍌', '🥥', '🍓', '🍇', '🍊', '🍋', '🍉',
  '🥑', '🍒', '🥝', '🍍', '🥕', '🌽', '🍄', '🍑',
];

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generatePuzzle(): Puzzle {
  const [a, b, c] = pick(EMOJI_POOL, 3) as [string, string, string];
  const A = randInt(2, 9);
  const B = randInt(2, 9);
  const C = randInt(1, 9);

  const k1 = randInt(2, 4);
  const k2 = randInt(2, 4);

  const eq1 = `${repeat(a, k1, ' + ')} = ${k1 * A}`;
  const eq2 = `${a} + ${repeat(b, k2, ' + ')} = ${A + k2 * B}`;
  const eq3 = `${b} ${C >= B ? '+' : '−'} ${c} = ${C >= B ? B + C : B - C}`;

  const finalExpression = `${c} + ${b} × ${a}`;
  const answer = C + B * A;

  return {
    emojis: [a, b, c],
    equations: [eq1, eq2, eq3],
    finalExpression,
    solution: { [a]: A, [b]: B, [c]: C },
    answer,
  };
}

function repeat(s: string, n: number, sep: string) {
  return Array(n).fill(s).join(sep);
}
