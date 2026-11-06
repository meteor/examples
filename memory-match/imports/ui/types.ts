import type { GameState, LeaderboardEntry } from '../game/types';

export interface MemoryGameProps {
  playerName: string;
  state: GameState;
  score?: number;
  leaderboard: readonly LeaderboardEntry[];
  onFlip(index: number): void | Promise<void>;
  disabled?: boolean;
}
