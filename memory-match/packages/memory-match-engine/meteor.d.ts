declare module 'meteor/memory-match-engine' {
  export interface PairCard {
    id: string;
    symbol: string;
  }

  export function createPairDeck(
    symbols: readonly string[],
  ): PairCard[];
}
