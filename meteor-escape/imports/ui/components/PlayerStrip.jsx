import React from 'react';
import { Bot, UserRound } from 'lucide-react';

function formatRole(role) {
  return role === 'copilot' ? 'Copilot' : 'Captain';
}

export function PlayerStrip({ players, turn }) {
  return (
    <section className="player-strip" aria-label="Crew roster">
      {players.map((player) => {
        const active = player.role === turn;
        const isCpu = player.type === 'cpu';
        const Icon = isCpu ? Bot : UserRound;

        return (
          <div
            key={player.id}
            className={`player-strip__item${active ? ' is-active' : ''}`}
            aria-current={active ? 'step' : undefined}
          >
            <span className="player-strip__icon" aria-hidden="true">
              <Icon size={18} strokeWidth={2.2} />
            </span>
            <span className="player-strip__copy">
              <strong>{formatRole(player.role)}</strong>
              <span>{isCpu ? 'CPU online' : 'Human aboard'}</span>
            </span>
          </div>
        );
      })}
    </section>
  );
}
