export interface PairCard {
  id: string;
  symbol: string;
}

export function createPairDeck(symbols: readonly string[]): PairCard[] {
  return symbols.flatMap((symbol) => [
    { id: `${symbol}-1`, symbol },
    { id: `${symbol}-2`, symbol },
  ]);
}
