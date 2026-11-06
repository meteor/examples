import type { CardState } from '../game/types';
import React from 'react';
import { MemoryCard } from './MemoryCard';

export function CardGrid({
  cards,
  disabled,
  onFlip,
}: {
  cards: readonly CardState[];
  disabled: boolean;
  onFlip(index: number): void | Promise<void>;
}) {
  return (
    <div aria-label="Memory cards" className="card-grid" role="grid">
      {cards.map((card, index) => (
        <MemoryCard
          card={card}
          disabled={disabled}
          index={index}
          key={card.id}
          onFlip={onFlip}
        />
      ))}
    </div>
  );
}
