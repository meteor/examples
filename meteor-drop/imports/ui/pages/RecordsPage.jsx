import React from 'react';
import { Badge, Block, Button, List, ListItem } from 'konsta/react';

function formatRelativeDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  return formatter.format(Math.round(diffHours / 24), 'day');
}

function getOutcome(game, playerId) {
  if (game.status === 'draw') {
    return { label: 'Draw', color: 'yellow' };
  }

  const playerRole =
    game.players.find((player) => player.id === playerId)?.role ?? null;
  return game.winner === playerRole
    ? { label: 'Win', color: 'green' }
    : { label: 'Loss', color: 'red' };
}

export function RecordsPage({
  games,
  playerId,
  ready,
  onPlay,
  actionLabel,
  disabled,
}) {
  if (!ready) {
    return (
      <Block strong className="records-empty">
        <h1>Records</h1>
        <p>Loading recent matches.</p>
      </Block>
    );
  }

  if (games.length === 0) {
    return (
      <Block strong className="records-empty">
        <h1>Records</h1>
        <p>Wins, losses, draws, and move counts appear here.</p>
        <Button className="records-page__action" onClick={onPlay} disabled={disabled}>
          {actionLabel}
        </Button>
      </Block>
    );
  }

  return (
    <section className="records-page">
      <header className="records-page__header">
        <div>
          <p className="eyebrow">Recent outcomes</p>
          <h1>Records</h1>
        </div>
        <Button className="records-page__action" onClick={onPlay} disabled={disabled}>
          {actionLabel}
        </Button>
      </header>

      <List inset strong className="records-list">
        {games.map((game) => {
          const outcome = getOutcome(game, playerId);
          return (
            <ListItem
              key={game._id}
              title={game.mode === 'live' ? 'Live match' : 'Solo vs CPU'}
              subtitle={`${game.moveCount} moves · ${formatRelativeDate(game.updatedAt)}`}
              after={
                <div className="records-list__after">
                  <Badge colors={outcome.color}>{outcome.label}</Badge>
                </div>
              }
            />
          );
        })}
      </List>
    </section>
  );
}
