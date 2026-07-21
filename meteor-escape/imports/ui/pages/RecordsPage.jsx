import React from 'react';
import { Badge, Block, Button, List, ListItem } from 'konsta/react';

function formatRelativeDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

export function RecordsPage({ games, ready, onPlay }) {
  if (!ready) {
    return (
      <Block strong className="records-empty">
        <h1>Records</h1>
        <p>Loading recent missions.</p>
      </Block>
    );
  }

  if (games.length === 0) {
    return (
      <Block strong className="records-empty">
        <h1>Records</h1>
        <p>Your completed missions land here with score, streak, and outcome.</p>
        <Button onClick={onPlay}>Start Quick Mission</Button>
      </Block>
    );
  }

  return (
    <section className="records-page">
      <div className="records-page__header">
        <div>
          <p className="eyebrow">Recent outcomes</p>
          <h1>Records</h1>
        </div>
        <Button small onClick={onPlay}>
          Play
        </Button>
      </div>

      <List inset strong className="records-list">
        {games.map((game) => (
          <ListItem
            key={game._id}
            title={`${game.mode === 'crew' ? 'Crew' : 'Solo'} mission`}
            subtitle={`Best streak ${game.bestStreak} • ${formatRelativeDate(game.updatedAt)}`}
            after={
              <div className="records-list__after">
                <Badge colors={game.status === 'won' ? 'green' : 'red'}>
                  {game.status === 'won' ? 'Escaped' : 'Lost'}
                </Badge>
                <strong>{game.score}</strong>
              </div>
            }
          />
        ))}
      </List>
    </section>
  );
}
