import React, { useEffect, useState } from 'react';
import { Home, RotateCcw, Share2, Trophy, TriangleAlert } from 'lucide-react';

function getResultCopy(game) {
  if (game.status === 'won') {
    return {
      title: 'Warp charged',
      detail: 'You punched through the field before the ship gave out.',
      Icon: Trophy,
      tone: 'mint',
    };
  }

  return {
    title: 'Shields collapsed',
    detail: 'The hull could not take another hit before warp finished charging.',
    Icon: TriangleAlert,
    tone: 'coral',
  };
}

export function ResultSheet({ game, opened, onRematch, onHome, onShare }) {
  const [shareMessage, setShareMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const copy = getResultCopy(game);
  const { Icon } = copy;

  useEffect(() => {
    if (opened) {
      setShareMessage('');
      setSharing(false);
    }
  }, [opened, game._id]);

  if (!opened) {
    return null;
  }

  return (
    <div className="result-sheet-backdrop">
      <section
        className={`result-sheet result-sheet--${copy.tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-sheet-title"
      >
        <div className="result-sheet__header">
          <div>
            <p className="eyebrow">Mission report</p>
            <h2 id="result-sheet-title">{copy.title}</h2>
          </div>
          <span className="result-sheet__icon" aria-hidden="true">
            <Icon size={26} strokeWidth={2.3} />
          </span>
        </div>

        <p className="result-sheet__detail">{copy.detail}</p>

        <dl className="result-sheet__stats">
          <div>
            <dt>Score</dt>
            <dd>{game.score}</dd>
          </div>
          <div>
            <dt>Warp</dt>
            <dd>{game.warp}%</dd>
          </div>
          <div>
            <dt>Shield</dt>
            <dd>{game.shield}%</dd>
          </div>
          <div>
            <dt>Best streak</dt>
            <dd>{game.bestStreak}</dd>
          </div>
        </dl>

        <div className="result-sheet__actions">
          <button className="result-sheet__button result-sheet__button--primary" type="button" onClick={onRematch}>
            <RotateCcw aria-hidden="true" size={18} strokeWidth={2.3} />
            <span>Rematch</span>
          </button>
          <button
            className="result-sheet__button"
            type="button"
            onClick={async () => {
              setSharing(true);
              try {
                const result = await onShare();
                if (result.shared) {
                  setShareMessage('Share sheet opened.');
                } else if (result.copied) {
                  setShareMessage('Mission summary copied.');
                } else {
                  setShareMessage('Share unavailable on this device.');
                }
              } finally {
                setSharing(false);
              }
            }}
            disabled={sharing}
          >
            <Share2 aria-hidden="true" size={18} strokeWidth={2.3} />
            <span>{sharing ? 'Sharing' : 'Share Result'}</span>
          </button>
          <button className="result-sheet__button" type="button" onClick={onHome}>
            <Home aria-hidden="true" size={18} strokeWidth={2.3} />
            <span>Home</span>
          </button>
        </div>

        {shareMessage ? <p className="result-sheet__message">{shareMessage}</p> : null}
      </section>
    </div>
  );
}
