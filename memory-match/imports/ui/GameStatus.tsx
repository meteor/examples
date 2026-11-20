import type { GameStatus as Status } from '../game/types';
import React from 'react';

export function GameStatus({
  moves,
  score,
  status,
}: {
  moves: number;
  score?: number;
  status: Status;
}) {
  return (
    <p aria-live="polite" className="game-status" role="status">
      {status === 'completed'
        ? `Game completed in ${moves} moves — score ${score ?? 0}`
        : status === 'resolving'
          ? `Moves: ${moves} — checking pair…`
          : `Moves: ${moves}`}
    </p>
  );
}
