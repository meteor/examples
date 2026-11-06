import type { LeaderboardEntry } from '../game/types';
import React from 'react';

export function Leaderboard({ entries }: { entries: readonly LeaderboardEntry[] }) {
  return (
    <section aria-labelledby="leaderboard-title" className="leaderboard">
      <h2 id="leaderboard-title">Shared leaderboard</h2>
      {entries.length ? (
        <ol>
          {entries.map((entry, index) => (
            <li key={`${entry.playerName}-${entry.completedAt}`}>
              {index + 1}. {entry.playerName} — {entry.score}
            </li>
          ))}
        </ol>
      ) : <p>No completed games yet.</p>}
    </section>
  );
}
