import type { CardState } from '../game/types';
import React from 'react';

export function MemoryCard({
  card,
  index,
  disabled,
  onFlip,
}: {
  card: CardState;
  index: number;
  disabled: boolean;
  onFlip(index: number): void | Promise<void>;
}) {
  const state = card.isMatched ? 'Matched' : card.isRevealed ? 'Revealed' : 'Hidden card';
  const label = card.isMatched || card.isRevealed ? `${state} ${card.symbol}` : `${state} ${index + 1}`;
  return (
    <button
      aria-label={label}
      className="memory-card"
      data-state={card.isMatched ? 'matched' : card.isRevealed ? 'revealed' : 'hidden'}
      disabled={disabled || card.isMatched || card.isRevealed}
      onClick={() => void onFlip(index)}
      type="button"
    >
      <span aria-hidden="true" className="memory-card__face memory-card__back">?</span>
      <span aria-hidden="true" className="memory-card__face memory-card__front">
        {card.symbol}
      </span>
    </button>
  );
}
