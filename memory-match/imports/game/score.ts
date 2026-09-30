import type { LeaderboardEntry } from './types';

export function calculateScore({
  moves,
  durationMs,
}: {
  moves: number;
  durationMs: number;
}): number {
  const movePenalty = Math.max(0, moves) * 250;
  const durationPenalty = Math.floor(Math.max(0, durationMs) / 1_000) * 10;
  return Math.max(100, 10_000 - movePenalty - durationPenalty);
}

export function compareLeaderboard(
  left: LeaderboardEntry,
  right: LeaderboardEntry,
): number {
  return right.score - left.score
    || left.moves - right.moves
    || left.completedAt - right.completedAt
    || left.playerName.localeCompare(right.playerName);
}
