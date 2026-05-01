import { useCallback, useEffect, useMemo, useState } from 'react';
import { generatePuzzle, type Puzzle, type Row } from './puzzle';
import SettingsPanel from './SettingsPanel';
import CreateSetModal from './CreateSetModal';
import { setFavicon, useSettings } from './settings';
import { BUILTIN_SETS, useCustomSets, type EmojiSet } from './sets';

const WIN_PHRASES = [
  'Beautiful.',
  'Mathematician energy.',
  'Crisp.',
  "That's the one.",
  'Look at you go.',
  'Solved like it owed you money.',
];
const ENCOURAGEMENT = [
  'Almost — check the trickiest one.',
  "So close. One number's playing hard to get.",
  'Worth another look.',
  'Reverse-engineer from the easy row.',
  'Order of operations is the boss here.',
];
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

type Status = 'right' | 'wrong' | 'idle';
type Feedback =
  | { kind: 'idle'; text: '' }
  | { kind: 'win'; text: string }
  | { kind: 'wrong'; text: string }
  | { kind: 'partial'; text: string }
  | { kind: 'nudge'; text: string };

type Hint = { emoji: string; value: number } | null;

// ───────────── Confetti ─────────────
type Burst = { id: number; pieces: ConfettiPiece[] };
type ConfettiPiece = {
  i: number;
  emoji: string;
  x: number;
  y: number;
  r: number;
  d: number;
  delay: number;
  size: number;
};

function Confetti({ emojis, trigger }: { emojis: string[]; trigger: number }) {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const id = trigger;
    const pieces: ConfettiPiece[] = Array.from({ length: 36 }).map((_, i) => ({
      i,
      emoji: emojis[i % emojis.length],
      x: (Math.random() - 0.5) * 700,
      y: -Math.random() * 600 - 100,
      r: (Math.random() - 0.5) * 720,
      d: 1.6 + Math.random() * 0.9,
      delay: Math.random() * 0.15,
      size: 22 + Math.random() * 22,
    }));
    setBursts((b) => [...b, { id, pieces }]);
    const t = setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 3000);
    return () => clearTimeout(t);
  }, [trigger, emojis]);

  return (
    <div className="confetti-layer" aria-hidden="true">
      {bursts.flatMap((b) =>
        b.pieces.map((p) => (
          <span
            key={`${b.id}-${p.i}`}
            className="confetti-piece"
            style={{
              ['--x' as string]: `${p.x}px`,
              ['--y' as string]: `${p.y}px`,
              ['--r' as string]: `${p.r}deg`,
              ['--d' as string]: `${p.d}s`,
              ['--delay' as string]: `${p.delay}s`,
              fontSize: `${p.size}px`,
            }}
          >
            {p.emoji}
          </span>
        )),
      )}
    </div>
  );
}

// ───────────── Equation card ─────────────
const TILTS = [-1.4, 0.9, -0.6, 1.2];

function EquationCard({
  row,
  idx,
  solvedMap,
  mystery,
}: {
  row: Row;
  idx: number;
  solvedMap: Record<string, number>;
  mystery: boolean;
}) {
  const tilt = TILTS[idx % 4];
  return (
    <div
      className={`eq-card ${mystery ? 'eq-mystery' : ''}`}
      style={{
        ['--tilt' as string]: `${tilt}deg`,
        ['--i' as string]: idx,
      }}
    >
      <div className="eq-tape" />
      <div className="eq-inner">
        <div className="eq-parts">
          {row.parts.map((p, i) => {
            if (p.kind === 'op') return <span key={i} className="eq-op">{p.val}</span>;
            const solved = solvedMap[p.val];
            return (
              <span key={i} className={`eq-glyph ${solved != null ? 'is-solved' : ''}`}>
                <span className="eq-emoji">{p.val}</span>
                {solved != null && <span className="eq-solved-num">{solved}</span>}
              </span>
            );
          })}
          <span className="eq-eq">=</span>
          <span className="eq-answer">{mystery ? '?' : row.answer}</span>
        </div>
      </div>
    </div>
  );
}

// ───────────── Solve line ─────────────
function SolveLine({
  emoji,
  value,
  onChange,
  status,
  autoFocus,
}: {
  emoji: string;
  value: string;
  onChange: (v: string) => void;
  status: Status;
  autoFocus?: boolean;
}) {
  return (
    <div className={`solve-line solve-${status}`}>
      <span className="solve-emoji">{emoji}</span>
      <span className="solve-eq">=</span>
      <div className="solve-input-wrap">
        <input
          type="number"
          inputMode="numeric"
          className="solve-input"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d-]/g, '').slice(0, 3))}
          aria-label={`Value for ${emoji}`}
          autoFocus={autoFocus}
        />
        <span className="solve-underline" />
        {status === 'right' && <span className="solve-tick">✓</span>}
        {status === 'wrong' && <span className="solve-cross">✗</span>}
      </div>
    </div>
  );
}

// ───────────── Hint chip ─────────────
function HintChip({ hint, onUse }: { hint: Hint; onUse: () => void }) {
  if (!hint) return null;
  return (
    <button className="hint-chip" onClick={onUse}>
      <span className="hint-bulb">💡</span>
      <span>
        I think <b>{hint.emoji}</b> = <b>{hint.value}</b>… apply?
      </span>
    </button>
  );
}

// ───────────── Feedback line ─────────────
function FeedbackLine({
  feedback,
  solvedAt,
  usedHint,
}: {
  feedback: Feedback;
  solvedAt: number | null;
  usedHint: boolean;
}) {
  if (solvedAt) {
    return (
      <div className="feedback feedback-win">
        <span className="fb-emoji">🎉</span>
        <span>Solved! {usedHint ? '(with a little hint — still counts)' : 'Nicely done.'}</span>
      </div>
    );
  }
  if (feedback.kind === 'idle') return <div className="feedback feedback-idle">&nbsp;</div>;
  const emoji =
    feedback.kind === 'wrong' ? '🤏' : feedback.kind === 'partial' ? '👀' : '💭';
  return (
    <div className={`feedback feedback-${feedback.kind}`}>
      <span className="fb-emoji">{emoji}</span>
      <span>{feedback.text}</span>
    </div>
  );
}

// ───────────── App ─────────────
export default function App() {
  const [settings, updateSetting] = useSettings();
  const { customSets, allSets, createSet, deleteSet, getSet } = useCustomSets();

  // Resolve the active set, falling back to fruit if missing (e.g. a deleted custom)
  const activeSet: EmojiSet = getSet(settings.emojiSetId) ?? BUILTIN_SETS[0];

  const [puzzle, setPuzzle] = useState<Puzzle>(() =>
    generatePuzzle(activeSet.emojis, settings.difficulty),
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [finalAnswer, setFinalAnswer] = useState('');
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [finalStatus, setFinalStatus] = useState<Status | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle', text: '' });
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [tornOff, setTornOff] = useState(false);
  const [solvedAt, setSolvedAt] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const [usedHint, setUsedHint] = useState(false);

  const resetBoard = useCallback(() => {
    setInputs({});
    setFinalAnswer('');
    setStatuses({});
    setFinalStatus(null);
    setFeedback({ kind: 'idle', text: '' });
    setSolvedAt(null);
    setUsedHint(false);
  }, []);

  const solvedMap = useMemo(() => {
    const m: Record<string, number> = {};
    puzzle.emojiOrder.forEach((e) => {
      if (statuses[e] === 'right') m[e] = puzzle.emojis[e];
    });
    return m;
  }, [statuses, puzzle]);

  const hint: Hint = useMemo(() => {
    if (!settings.showHints) return null;
    for (const row of puzzle.rows) {
      const counts: Record<string, number> = {};
      row.parts.forEach((p) => {
        if (p.kind === 'emoji') counts[p.val] = (counts[p.val] ?? 0) + 1;
      });
      const emojis = Object.keys(counts);
      if (emojis.length === 1) {
        const e = emojis[0];
        if (statuses[e] !== 'right' && row.answer % counts[e] === 0) {
          return { emoji: e, value: row.answer / counts[e] };
        }
      }
      if (emojis.length === 2) {
        const [e1, e2] = emojis;
        if (statuses[e1] === 'right' && statuses[e2] !== 'right') {
          const remaining = row.answer - counts[e1] * puzzle.emojis[e1];
          if (remaining % counts[e2] === 0) return { emoji: e2, value: remaining / counts[e2] };
        }
        if (statuses[e2] === 'right' && statuses[e1] !== 'right') {
          const remaining = row.answer - counts[e2] * puzzle.emojis[e2];
          if (remaining % counts[e1] === 0) return { emoji: e1, value: remaining / counts[e1] };
        }
      }
    }
    return null;
  }, [puzzle, statuses, settings.showHints]);

  function handleInput(emoji: string, val: string) {
    setInputs((s) => ({ ...s, [emoji]: val }));
    setStatuses((s) => {
      const n = { ...s };
      delete n[emoji];
      return n;
    });
    setFinalStatus(null);
    setFeedback({ kind: 'idle', text: '' });
  }

  function check() {
    const newStatuses: Record<string, Status> = {};
    let allRight = true;
    let anyWrong = false;
    let filled = 0;
    puzzle.emojiOrder.forEach((e) => {
      const v = inputs[e];
      if (v === '' || v == null) {
        allRight = false;
        return;
      }
      filled++;
      if (+v === puzzle.emojis[e]) newStatuses[e] = 'right';
      else {
        newStatuses[e] = 'wrong';
        anyWrong = true;
        allRight = false;
      }
    });
    setStatuses(newStatuses);

    let finalOK = false;
    if (finalAnswer !== '' && +finalAnswer === puzzle.finalRow.answer) {
      finalOK = true;
      setFinalStatus('right');
    } else if (finalAnswer !== '') {
      setFinalStatus('wrong');
      anyWrong = true;
    } else {
      setFinalStatus(null);
    }

    if (allRight && finalOK) {
      setFeedback({ kind: 'win', text: pick(WIN_PHRASES) });
      setConfettiTrigger(Date.now());
      setSolvedAt(Date.now());
    } else if (anyWrong) {
      setFeedback({ kind: 'wrong', text: pick(ENCOURAGEMENT) });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else if (filled === 0 && finalAnswer === '') {
      setFeedback({ kind: 'nudge', text: "Try guessing one — there's always an easy row." });
    } else {
      setFeedback({ kind: 'partial', text: 'Looking good. Keep going.' });
    }
  }

  function newPuzzle() {
    setTornOff(true);
    setTimeout(() => {
      setPuzzle(generatePuzzle(activeSet.emojis, settings.difficulty));
      resetBoard();
      setTornOff(false);
    }, 380);
  }

  // Regenerate when active set or difficulty changes
  useEffect(() => {
    setPuzzle(generatePuzzle(activeSet.emojis, settings.difficulty));
    resetBoard();
  }, [activeSet.id, settings.difficulty, resetBoard, activeSet.emojis]);

  // Sync favicon to active set's logo
  useEffect(() => {
    setFavicon(activeSet.logo);
  }, [activeSet.logo]);

  // If the user deletes the currently selected custom set, fall back to fruit
  useEffect(() => {
    if (!getSet(settings.emojiSetId)) {
      updateSetting('emojiSetId', 'fruit');
    }
  }, [settings.emojiSetId, getSet, updateSetting]);

  function applyHint() {
    if (!hint) return;
    setInputs((s) => ({ ...s, [hint.emoji]: String(hint.value) }));
    setUsedHint(true);
  }

  return (
    <div className={`app ${shake ? 'is-shake' : ''} ${tornOff ? 'is-tearing' : ''}`}>
      <Confetti emojis={puzzle.emojiOrder} trigger={confettiTrigger} />
      <SettingsPanel
        settings={settings}
        onChange={updateSetting}
        allSets={allSets}
        customSets={customSets}
        onCreateSet={() => setCreateOpen(true)}
        onDeleteSet={deleteSet}
      />
      <CreateSetModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(input) => {
          const id = createSet(input);
          updateSetting('emojiSetId', id);
        }}
      />

      <header className="masthead">
        <div className="logo-wrap">
          <h1 className="logo">
            <span>em</span>
            <span className="logo-emoji">{activeSet.logo}</span>
            <span>ji</span>
            <span className="logo-puzzle">puzzle</span>
          </h1>
          <div className="logo-underline" aria-hidden="true">
            <svg viewBox="0 0 300 18" preserveAspectRatio="none">
              <path d="M4 11 C 40 4, 80 16, 120 9 S 200 4, 240 12 S 290 7, 296 10" />
            </svg>
          </div>
        </div>
        <p className="tagline">
          Emoji math. No accounts. Free forever. <span className="tag-spark">∞</span> puzzles.
        </p>
      </header>

      <main className="board">
        <section className="stack" aria-label="Equations">
          {puzzle.rows.map((row, i) => (
            <EquationCard
              key={`${puzzle.seed}-${i}`}
              row={row}
              idx={i}
              solvedMap={solvedMap}
              mystery={false}
            />
          ))}
          <EquationCard
            key={`${puzzle.seed}-final`}
            row={puzzle.finalRow}
            idx={3}
            solvedMap={solvedMap}
            mystery={finalStatus !== 'right'}
          />
        </section>

        <section className="solver">
          <h2 className="solver-title">
            Solve for each <em>{activeSet.noun}</em>
          </h2>

          <div className="solve-grid">
            {puzzle.emojiOrder.map((e, i) => (
              <SolveLine
                key={e}
                emoji={e}
                value={inputs[e] ?? ''}
                onChange={(v) => handleInput(e, v)}
                status={statuses[e] ?? 'idle'}
                autoFocus={i === 0}
              />
            ))}
            <div className={`solve-line solve-final solve-${finalStatus ?? 'idle'}`}>
              <span className="solve-emoji solve-final-mark">★</span>
              <span className="solve-eq">=</span>
              <div className="solve-input-wrap">
                <input
                  className="solve-input solve-input-final"
                  inputMode="numeric"
                  placeholder="final answer"
                  value={finalAnswer}
                  onChange={(e) => {
                    setFinalAnswer(e.target.value.replace(/[^\d-]/g, '').slice(0, 4));
                    setFinalStatus(null);
                    setFeedback({ kind: 'idle', text: '' });
                  }}
                />
                <span className="solve-underline" />
                {finalStatus === 'right' && <span className="solve-tick">✓</span>}
                {finalStatus === 'wrong' && <span className="solve-cross">✗</span>}
              </div>
            </div>
          </div>

          <HintChip hint={hint && !solvedAt ? hint : null} onUse={applyHint} />

          <div className="actions">
            <button className="btn btn-primary" onClick={check}>
              <span>Check</span>
              <span className="btn-arrow">→</span>
            </button>
            <button className="btn btn-secondary" onClick={newPuzzle}>
              <span className="btn-shuffle" aria-hidden="true">
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 4 L15 6 L13 8" />
                  <path d="M1 6 L15 6" />
                  <path d="M3 12 L1 10 L3 8" />
                  <path d="M15 10 L1 10" />
                </svg>
              </span>
              <span>New puzzle</span>
            </button>
          </div>

          <FeedbackLine feedback={feedback} solvedAt={solvedAt} usedHint={usedHint} />
        </section>
      </main>
    </div>
  );
}
