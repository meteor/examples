import { Meteor } from 'meteor/meteor';
import { useSubscribe, useTracker } from 'meteor/react-meteor-data';
import React, { useState } from 'react';

import { Games } from '../api/games';
import type { LeaderboardEntry } from '../game/types';
import { Leaderboard } from './Leaderboard';
import { MemoryGame } from './MemoryGame';
import { NameForm } from './NameForm';
import { useMemoryGame } from './useMemoryGame';

function ActiveGame({
  gameId,
  leaderboard,
  onNewGame,
}: {
  gameId: string;
  leaderboard: readonly LeaderboardEntry[];
  onNewGame(): void;
}) {
  const { error, flip, game, isFlipping, isLoading } = useMemoryGame(gameId);
  if (isLoading) return <p role="status">Loading game…</p>;
  if (!game) return <p role="alert">Game could not be loaded.</p>;
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <MemoryGame
        disabled={isFlipping}
        leaderboard={leaderboard}
        onFlip={flip}
        playerName={game.playerName}
        score={game.score}
        state={game.state}
      />
      <button className="new-game" onClick={onNewGame} type="button">New game</button>
    </>
  );
}

export function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [startError, setStartError] = useState('');
  const leaderboardLoading = useSubscribe('memory.leaderboard')();
  const leaderboard = useTracker<LeaderboardEntry[]>(() => Games.find(
    { 'state.status': 'completed', score: { $exists: true } },
    { sort: { score: -1, 'state.moves': 1, 'state.completedAt': 1 }, limit: 10 },
  ).fetch().map((game) => ({
    playerName: game.playerName,
    score: game.score ?? 0,
    moves: game.state.moves,
    completedAt: game.state.completedAt ?? 0,
  })), []);

  async function start(playerName: string) {
    setStartError('');
    try {
      const querySeed = new URLSearchParams(window.location.search).get('seed');
      const seed = querySeed && (Meteor.isTest || Meteor.isAppTest) ? querySeed : undefined;
      const id = await Meteor.callAsync('memory.start', {
        playerName,
        ...(seed ? { seed } : {}),
      }) as string;
      setGameId(id);
    } catch (caught) {
      setStartError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Memory Match</h1>
        <p>Find eight cosmic pairs. Every completed game joins the shared leaderboard.</p>
      </header>
      {startError && <p role="alert">{startError}</p>}
      {gameId
        ? <ActiveGame gameId={gameId} leaderboard={leaderboard} onNewGame={() => setGameId(null)} />
        : (
          <>
            <NameForm onStart={start} />
            {leaderboardLoading
              ? <p role="status">Loading leaderboard…</p>
              : <Leaderboard entries={leaderboard} />}
          </>
        )}
    </main>
  );
}
