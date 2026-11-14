import React from 'react';
import { CloudOff, Radio, Sparkles, UserRound } from 'lucide-react';
import { getAvailableColumns } from '../../api/games/engine';
import { MeteorBoard } from './MeteorBoard';

function getPlayerRole(game, playerId) {
  return game.players.find((player) => player.id === playerId)?.role ?? null;
}

function getTurnCopy(game, playerRole) {
  if (game.status !== 'playing') {
    return {
      eyebrow: 'Match complete',
      title: game.status === 'draw' ? 'Board full' : 'Four connected',
      detail: 'Open result or return home.',
    };
  }

  if (game.turn === playerRole) {
    return {
      eyebrow: 'Your meteor',
      title: 'Your turn',
      detail: 'Tap any open column.',
    };
  }

  if (game.players[1]?.type === 'cpu') {
    return {
      eyebrow: 'Teal meteor',
      title: 'CPU thinking',
      detail: 'Move arrives through live Meteor data.',
    };
  }

  return {
    eyebrow: 'Teal meteor',
    title: "Rival's turn",
    detail: 'Board updates when their meteor lands.',
  };
}

function getLastMoveCopy(game, playerRole) {
  if (!game.lastMove) {
    return 'First four connected wins.';
  }

  const actor = game.lastMove.marker === playerRole ? 'You' : game.players[1]?.type === 'cpu' ? 'CPU' : 'Rival';
  return `${actor} dropped in column ${game.lastMove.column + 1}.`;
}

export function MatchStage({
  game,
  playerId,
  busy,
  connected,
  onDrop,
}) {
  const playerRole = getPlayerRole(game, playerId);
  const isPlayerTurn = game.status === 'playing' && game.turn === playerRole;
  const turnCopy = getTurnCopy(game, playerRole);

  return (
    <section className="match-stage" aria-labelledby="match-turn-title">
      <header className="match-stage__header">
        <div>
          <p className="eyebrow">{turnCopy.eyebrow}</p>
          <h1 id="match-turn-title">{turnCopy.title}</h1>
          <p>{turnCopy.detail}</p>
        </div>
        <span className={`match-stage__connection${connected ? ' is-online' : ''}`}>
          {connected ? (
            <Radio aria-hidden="true" size={16} strokeWidth={2.4} />
          ) : (
            <CloudOff aria-hidden="true" size={16} strokeWidth={2.4} />
          )}
          {connected ? 'Live' : 'Offline'}
        </span>
      </header>

      <div className="match-stage__players" aria-label="Players">
        <div className={`match-player${game.turn === playerRole ? ' is-active' : ''}`}>
          <span className="match-player__meteor match-player__meteor--coral" />
          <span>
            <strong>You</strong>
            <small>Coral meteors</small>
          </span>
        </div>
        <span className="match-stage__versus">VS</span>
        <div className={`match-player${game.turn !== playerRole ? ' is-active' : ''}`}>
          <span className="match-player__meteor match-player__meteor--teal" />
          <span>
            <strong>{game.players[1]?.type === 'cpu' ? 'CPU' : 'Rival'}</strong>
            <small>Teal meteors</small>
          </span>
        </div>
      </div>

      <MeteorBoard
        board={game.board}
        winningCells={game.winningCells}
        lastMove={game.lastMove}
        interactive={isPlayerTurn && connected && !busy}
        availableColumns={getAvailableColumns(game)}
        onDrop={onDrop}
      />

      <footer className="match-stage__footer" aria-live="polite">
        <span>
          {game.status === 'playing' ? (
            <UserRound aria-hidden="true" size={17} strokeWidth={2.3} />
          ) : (
            <Sparkles aria-hidden="true" size={17} strokeWidth={2.3} />
          )}
          {getLastMoveCopy(game, playerRole)}
        </span>
        <strong>{game.moveCount} moves</strong>
      </footer>
    </section>
  );
}
