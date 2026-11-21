import React from 'react';
import { Home, RotateCcw, Share2, Trophy, X } from 'lucide-react';
import { Sheet } from 'konsta/react';
import { useDialogFocusTrap } from '../useDialogFocusTrap';

function getResultCopy(game, playerId) {
  if (game.status === 'draw') {
    return {
      eyebrow: 'Match result',
      title: 'Board full',
      outcome: 'Draw',
      detail: 'No open spaces remain. One more match?',
    };
  }

  const playerRole =
    game.players.find((player) => player.id === playerId)?.role ?? null;
  const playerWon = game.winner === playerRole;
  const opponent = game.players[1]?.type === 'cpu' ? 'CPU' : 'Rival';

  return {
    eyebrow: 'Match result',
    title: 'Four connected!',
    outcome: playerWon ? 'You win' : `${opponent} wins`,
    detail: playerWon
      ? 'Your meteors formed the winning line.'
      : `${opponent} connected four first.`,
  };
}

export function MatchResultSheet({
  game,
  playerId,
  opened,
  rematching,
  onRematch,
  onShare,
  onHome,
  onClose,
}) {
  const copy = getResultCopy(game, playerId);
  const { dialogRef, onDialogKeyDown } = useDialogFocusTrap({
    opened,
    onDismiss: onClose,
    dismissDisabled: rematching,
  });

  if (!opened) {
    return null;
  }

  return (
    <Sheet
      opened={opened}
      backdrop
      onBackdropClick={rematching ? undefined : onClose}
      className="match-result-frame"
    >
      <section
        className="match-result"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-result-title"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
      >
        <header className="match-result__header">
          <div className="match-result__icon">
            <Trophy aria-hidden="true" size={30} strokeWidth={2.1} />
          </div>
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 id="match-result-title">{copy.title}</h2>
          </div>
          <button
            className="match-result__close"
            type="button"
            aria-label="Close result"
            onClick={onClose}
            disabled={rematching}
          >
            <X aria-hidden="true" size={24} strokeWidth={2.3} />
          </button>
        </header>

        <div className="match-result__summary">
          <strong>{copy.outcome}</strong>
          <span>{game.moveCount} moves</span>
        </div>
        <p className="match-result__detail">{copy.detail}</p>

        <div className="match-result__actions">
          <button
            className="match-result__button match-result__button--primary"
            type="button"
            onClick={onRematch}
            disabled={rematching}
          >
            <RotateCcw aria-hidden="true" size={20} strokeWidth={2.3} />
            {rematching ? 'Starting' : 'Rematch'}
          </button>
          <button
            className="match-result__button"
            type="button"
            onClick={onShare}
          >
            <Share2 aria-hidden="true" size={20} strokeWidth={2.3} />
            Share Result
          </button>
          <button
            className="match-result__button"
            type="button"
            onClick={onHome}
          >
            <Home aria-hidden="true" size={20} strokeWidth={2.3} />
            Home
          </button>
        </div>
      </section>
    </Sheet>
  );
}
