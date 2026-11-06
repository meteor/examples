export const CARD_SYMBOLS = ['☄️', '🪐', '🚀', '🌙', '⭐', '🛰️', '👾', '🌌'] as const;

export type CardSymbol = (typeof CARD_SYMBOLS)[number];

export interface CardDefinition {
  readonly id: string;
  readonly symbol: CardSymbol;
}

export interface CardState extends CardDefinition {
  readonly isRevealed: boolean;
  readonly isMatched: boolean;
}

export type GameStatus = 'playing' | 'resolving' | 'completed';

export interface GameState {
  readonly cards: readonly CardState[];
  readonly firstSelection: number | null;
  readonly secondSelection: number | null;
  readonly moves: number;
  readonly status: GameStatus;
  readonly startedAt: number;
  readonly completedAt: number | null;
}

export interface LeaderboardEntry {
  readonly playerName: string;
  readonly score: number;
  readonly moves: number;
  readonly completedAt: number;
}
