import { useEffect, useRef, useState } from 'react';
import type { Difficulty, EmojiSetKey } from './puzzle';
import type { Settings, Theme } from './settings';

type Props = {
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, val: Settings[K]) => void;
};

const THEMES: { value: Theme; label: string }[] = [
  { value: 'cream', label: 'Cream' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'arcade', label: 'Arcade' },
];

const EMOJI_SETS: { value: EmojiSetKey; label: string }[] = [
  { value: 'fruit', label: '🍎 Fruit' },
  { value: 'animals', label: '🦊 Animals' },
  { value: 'weather', label: '☀️ Weather' },
  { value: 'party', label: '🎈 Party' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 1, label: 'Easy' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Hard' },
];

export default function SettingsPanel({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className="settings" ref={popRef}>
      <button
        className="settings-trigger"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="settings-pop" role="dialog" aria-label="Settings">
          <Section title="Theme">
            <Segmented
              options={THEMES}
              value={settings.theme}
              onChange={(v) => onChange('theme', v)}
            />
          </Section>

          <Section title="Emoji set">
            <select
              className="settings-select"
              value={settings.emojiSet}
              onChange={(e) => onChange('emojiSet', e.target.value as EmojiSetKey)}
            >
              {EMOJI_SETS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Section>

          <Section title="Difficulty">
            <Segmented
              options={DIFFICULTIES}
              value={settings.difficulty}
              onChange={(v) => onChange('difficulty', v)}
            />
          </Section>

          <div className="settings-row settings-row-h">
            <span className="settings-label">Show hints</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.showHints}
              className="settings-toggle"
              data-on={settings.showHints ? '1' : '0'}
              onClick={() => onChange('showHints', !settings.showHints)}
            >
              <i />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="settings-section">
      <div className="settings-label">{title}</div>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="settings-seg" role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`settings-seg-btn ${o.value === value ? 'is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
