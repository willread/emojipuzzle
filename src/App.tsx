import { useState } from 'react';
import { generatePuzzle, type Puzzle } from './puzzle';

type Guesses = Record<string, string>;

export default function App() {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle());
  const [guesses, setGuesses] = useState<Guesses>({});
  const [checked, setChecked] = useState(false);
  const [finalGuess, setFinalGuess] = useState('');

  const reset = () => {
    setPuzzle(generatePuzzle());
    setGuesses({});
    setChecked(false);
    setFinalGuess('');
  };

  const allCorrect = puzzle.emojis.every(
    (e) => Number(guesses[e]) === puzzle.solution[e],
  );
  const finalCorrect = Number(finalGuess) === puzzle.answer;

  return (
    <main className="app">
      <header>
        <h1>emojipuzzle</h1>
        <p className="tagline">Emoji math. No accounts. Free forever. Unlimited puzzles.</p>
      </header>

      <section className="puzzle">
        {puzzle.equations.map((eq, i) => (
          <div className="equation" key={i}>{eq}</div>
        ))}
        <div className="equation final">{puzzle.finalExpression} = ?</div>
      </section>

      <section className="inputs">
        <h2>Solve for each emoji</h2>
        <div className="guess-grid">
          {puzzle.emojis.map((emoji) => {
            const value = guesses[emoji] ?? '';
            const correct = checked && Number(value) === puzzle.solution[emoji];
            const wrong = checked && value !== '' && !correct;
            return (
              <label key={emoji} className="guess">
                <span className="emoji">{emoji}</span>
                <span className="equals">=</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) =>
                    setGuesses((g) => ({ ...g, [emoji]: e.target.value }))
                  }
                  className={correct ? 'ok' : wrong ? 'bad' : ''}
                />
              </label>
            );
          })}
        </div>

        <label className="guess final-guess">
          <span className="emoji">=</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="final answer"
            value={finalGuess}
            onChange={(e) => setFinalGuess(e.target.value)}
            className={
              checked && finalGuess !== ''
                ? finalCorrect ? 'ok' : 'bad'
                : ''
            }
          />
        </label>

        <div className="actions">
          <button onClick={() => setChecked(true)}>Check</button>
          <button onClick={reset} className="secondary">New puzzle</button>
        </div>

        {checked && allCorrect && finalCorrect && (
          <p className="win">🎉 Solved! Try another?</p>
        )}
        {checked && !(allCorrect && finalCorrect) && (
          <p className="hint">Keep going — not quite.</p>
        )}
      </section>

      <footer>
        <p>No accounts, no limits, no ads.</p>
      </footer>
    </main>
  );
}
