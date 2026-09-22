import { createSeededRandom } from './rng';
import { CARD_SYMBOLS, type CardDefinition } from './types';

if (import.meta.rstest) {
  const { expect, test } = import.meta.rstest;
  test('normalizes human-entered seeds before shuffling', () => {
    expect(normalizeSeed('  Memory LAB  ')).toBe('memory lab');
  });
}

export function normalizeSeed(seed: string): string {
  return seed
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/\s+/g, ' ') || 'memory-match';
}

export function createDeck(seed: string): readonly CardDefinition[] {
  const random = createSeededRandom(normalizeSeed(seed));
  const cards = CARD_SYMBOLS.flatMap((symbol, symbolIndex) => [
    { id: `${symbolIndex}-a`, symbol },
    { id: `${symbolIndex}-b`, symbol },
  ]);

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [cards[index], cards[target]] = [cards[target], cards[index]];
  }
  return cards;
}
