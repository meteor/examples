import { CardGrid } from './CardGrid';
import React from 'react';
import { GameStatus } from './GameStatus';
import { Leaderboard } from './Leaderboard';
import type { MemoryGameProps } from './types';

export function MemoryGame({
  playerName,
  state,
  score,
  leaderboard,
  onFlip,
  disabled = false,
}: MemoryGameProps) {
  return (
    <section className="memory-game">
      <h2>{playerName}&apos;s board</h2>
      <GameStatus moves={state.moves} score={score} status={state.status} />
      <CardGrid
        cards={state.cards}
        disabled={disabled || state.status !== 'playing'}
        onFlip={onFlip}
      />
      <Leaderboard entries={leaderboard} />
    </section>
  );
}
