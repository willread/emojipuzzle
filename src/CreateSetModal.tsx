import { useEffect, useState } from 'react';

const PICKER_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: [
      '😀', '😂', '😍', '🥰', '😎', '🤔', '😴', '🥳', '🤯', '😱',
      '🤢', '🤮', '🥴', '😈', '🤡', '👻', '💀', '👽', '🤖', '👾',
    ],
  },
  {
    label: 'Animals',
    emojis: [
      '🐶', '🐱', '🦊', '🐰', '🐻', '🐼', '🐯', '🦁', '🐮', '🐷',
      '🐸', '🐵', '🐔', '🦆', '🦉', '🐺', '🦄', '🐝', '🐛', '🐜',
      '🦋', '🐌', '🪱', '🪳', '🕷️', '🐢', '🐍', '🐙', '🐠', '🐳',
      '🐬', '🦈', '🦒', '🐘', '🦏', '🐹', '🐀', '🦔',
    ],
  },
  {
    label: 'Food',
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍐', '🥭',
      '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🌶️', '🌽', '🥕', '🥔',
      '🍞', '🧀', '🍔', '🍟', '🍕', '🌭', '🌮', '🍣', '🍜', '🍩',
      '🍪', '🎂', '🍰', '🧁', '🍫', '🍭', '🍬', '🍿',
    ],
  },
  {
    label: 'Nature',
    emojis: [
      '☀️', '🌙', '⭐', '🌟', '✨', '⚡', '🔥', '💧', '🌊', '🌈',
      '☔', '❄️', '⛄', '🌪️', '🌧️', '⛈️', '🌹', '🌻', '🌷', '🌸',
      '🌳', '🌲', '🌴', '🌵', '🍀', '🍁', '🍂', '🍄',
    ],
  },
  {
    label: 'Activity',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🏸', '🥊',
      '🎯', '🎮', '🎲', '🎨', '🎤', '🎸', '🎹', '🎺', '🥁', '🚀',
      '✈️', '🚗', '🚌', '🚓', '🚲', '⛵', '🚢',
    ],
  },
  {
    label: 'Objects',
    emojis: [
      '🧸', '🎈', '🎁', '🎉', '🎀', '🎄', '🎃', '💡', '🔮', '💎',
      '💰', '🏆', '🥇', '⏰', '📚', '✏️', '🔑', '🚽', '🧻', '🧦',
      '🗑️', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯',
    ],
  },
];

const TARGET = 6;

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; emojis: string[] }) => void;
};

export default function CreateSetModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName('');
      setPicked([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const togglePick = (emoji: string) => {
    setPicked((curr) => {
      if (curr.includes(emoji)) return curr.filter((e) => e !== emoji);
      if (curr.length >= TARGET) return curr;
      return [...curr, emoji];
    });
  };

  const removeAt = (idx: number) => {
    setPicked((curr) => curr.filter((_, i) => i !== idx));
  };

  const canSave = name.trim().length > 0 && picked.length === TARGET;

  const submit = () => {
    if (!canSave) return;
    onCreate({ name: name.trim(), emojis: picked });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Create custom set" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">Create custom set</h3>
          <button className="modal-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className="modal-field">
          <span className="modal-label">Name</span>
          <input
            type="text"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 30))}
            placeholder="e.g. Spooky"
            autoFocus
          />
        </label>

        <div className="modal-field">
          <div className="modal-label">
            Pick {TARGET} emojis ({picked.length}/{TARGET})
          </div>
          <div className="picker-slots">
            {Array.from({ length: TARGET }).map((_, i) => {
              const e = picked[i];
              return (
                <button
                  key={i}
                  type="button"
                  className={`picker-slot ${e ? 'has-emoji' : ''}`}
                  onClick={() => e && removeAt(i)}
                  aria-label={e ? `Remove ${e}` : 'Empty slot'}
                  disabled={!e}
                >
                  {e ?? '·'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="picker-grid-wrap">
          {PICKER_CATEGORIES.map((cat) => (
            <div className="picker-cat" key={cat.label}>
              <div className="picker-cat-label">{cat.label}</div>
              <div className="picker-grid">
                {cat.emojis.map((e) => {
                  const isPicked = picked.includes(e);
                  const full = picked.length >= TARGET && !isPicked;
                  return (
                    <button
                      key={e}
                      type="button"
                      className={`picker-cell ${isPicked ? 'is-picked' : ''}`}
                      onClick={() => togglePick(e)}
                      disabled={full}
                      aria-pressed={isPicked}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={!canSave}>
            Save set
          </button>
        </div>
      </div>
    </div>
  );
}
