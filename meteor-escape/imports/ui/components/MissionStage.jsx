import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Radio, Shield, Users, Zap } from 'lucide-react';
import { getRequiredAction } from '../../api/games/engine';
import { ShipArt } from '../art/ShipArt';
import { ActionControls } from './ActionControls';
import { EmergencyPrompt } from './EmergencyPrompt';
import { PlayerStrip } from './PlayerStrip';
import { SystemMeter } from './SystemMeter';

function formatClock(target, now) {
  if (!target) {
    return 'Live';
  }

  const seconds = Math.max(0, Math.ceil((target - now) / 1000));
  return `${seconds}s`;
}

function describeEvent(event) {
  if (!event) {
    return 'Crew standing by';
  }

  if (event.outcome === 'correct') {
    return 'Warp charged';
  }

  if (event.outcome === 'wrong' || event.outcome === 'late') {
    return 'Shield hit';
  }

  return 'Mission expired';
}

function formatFeedLine(event) {
  const actor =
    event.actorId === 'copilot'
      ? 'CPU'
      : event.actorId
        ? 'Crew'
        : 'System';

  return `${describeEvent(event)} · ${actor}`;
}

function getTurnStatus(game) {
  if (game.status === 'waiting') {
    return 'Waiting for a live copilot';
  }

  if (game.status === 'won') {
    return 'Warp charged';
  }

  if (game.status === 'lost') {
    return 'Shields collapsed';
  }

  return game.turn === 'copilot' ? 'Copilot thinking' : 'Your turn';
}

function buildAnnouncement(game) {
  const latestEvent = game.events.at(-1) ?? null;

  if (game.status === 'won') {
    return 'Warp charged. Mission complete.';
  }

  if (game.status === 'lost') {
    return 'Shields collapsed. Mission lost.';
  }

  if (game.status === 'waiting') {
    return `Crew lobby ready. Room code ${game.roomCode}.`;
  }

  const turnCopy = game.turn === 'copilot' ? 'Copilot turn.' : 'Your turn.';
  if (latestEvent) {
    return `${describeEvent(latestEvent)}. ${turnCopy}`;
  }

  return turnCopy;
}

export function MissionStage({ game, now, busy, connected, onAction }) {
  const [liveMessage, setLiveMessage] = useState(buildAnnouncement(game));
  const previousKeyRef = useRef('');
  const recommendedAction = useMemo(() => getRequiredAction(game.emergency), [game.emergency]);
  const turnExpired = Boolean(game.turnEndsAt && now > game.turnEndsAt);
  const missionExpired = Boolean(game.endsAt && now > game.endsAt);
  const controlsDisabled =
    busy ||
    !connected ||
    game.status !== 'playing' ||
    game.turn !== 'player' ||
    turnExpired ||
    missionExpired;
  const latestEvent = game.events.at(-1) ?? null;
  const statusText = getTurnStatus(game);

  useEffect(() => {
    const latestEventKey = latestEvent
      ? `${latestEvent.now}:${latestEvent.outcome}:${latestEvent.action ?? 'timeout'}`
      : 'none';
    const key = `${game._id}:${game.status}:${game.turn}:${latestEventKey}`;

    if (previousKeyRef.current === key) {
      return;
    }

    previousKeyRef.current = key;
    setLiveMessage(buildAnnouncement(game));
  }, [game, latestEvent]);

  return (
    <div className={`mission-stage mission-stage--${game.status}`}>
      <p className="mission-stage__live" role="status" aria-live="polite">
        {liveMessage}
      </p>

      <section className="mission-stage__hero">
        <div className="mission-stage__headline">
          <div>
            <p className="eyebrow">{game.mode === 'crew' ? 'Crew Mission' : 'Quick Mission'}</p>
            <h1>{game.status === 'waiting' ? 'Crew lobby ready' : 'Mission control'}</h1>
          </div>
          <span className={`mission-stage__turn mission-stage__turn--${game.turn}`}>
            {game.status === 'waiting'
              ? 'Waiting'
              : game.turn === 'copilot'
                ? 'Copilot turn'
                : 'Your turn'}
          </span>
        </div>

        <div className="mission-stage__signal">
          <span className={`mission-stage__signal-dot${connected ? ' is-online' : ''}`} aria-hidden="true" />
          <span>{connected ? 'Reactive feed connected' : 'Mission controls paused'}</span>
        </div>

        <ShipArt emergency={game.emergency} turn={game.turn} status={game.status} />
      </section>

      <PlayerStrip players={game.players} turn={game.turn} />

      <section className="mission-stage__meters" aria-label="Mission status">
        <SystemMeter
          label="Shield"
          value={game.shield}
          helper={latestEvent && game.status !== 'won' ? describeEvent(latestEvent) : 'Hull integrity buffer'}
          tone="cyan"
          icon={Shield}
        />
        <SystemMeter
          label="Warp"
          value={game.warp}
          helper={game.status === 'won' ? 'Escape vector complete' : 'Charge to 100% to clear the field'}
          tone="mint"
          icon={Zap}
        />
        <SystemMeter
          label="Mission clock"
          value={Math.round(
            Math.max(0, Math.min(100, ((game.endsAt ?? now) - now) / 600))
          )}
          helper={formatClock(game.endsAt, now)}
          tone="yellow"
          icon={Clock3}
        />
        <SystemMeter
          label="Crew sync"
          value={game.players.length * 50}
          helper={game.roomCode ? `Room ${game.roomCode}` : 'CPU copilot online'}
          tone="coral"
          icon={Users}
        />
      </section>

      <EmergencyPrompt emergency={game.emergency} statusText={statusText} />

      {game.status === 'waiting' ? (
        <section className="mission-stage__waiting">
          <h2>Invite a copilot</h2>
          <p>Share room code <strong>{game.roomCode}</strong> to replace the CPU with another human.</p>
        </section>
      ) : (
        <ActionControls
          busy={busy}
          disabled={controlsDisabled}
          recommendedAction={recommendedAction}
          onAction={onAction}
        />
      )}

      <section className="mission-stage__feed" aria-label="Event feed">
        <div className="mission-stage__feed-header">
          <h2>Mission feed</h2>
          <span>
            <Radio aria-hidden="true" size={16} strokeWidth={2.25} />
            {statusText}
          </span>
        </div>

        <ol className="mission-stage__events">
          {game.events.length > 0 ? (
            game.events
              .slice()
              .reverse()
              .map((event, index) => (
                <li key={`${event.now}-${index}`}>
                  <strong>{describeEvent(event)}</strong>
                  <span>{formatFeedLine(event)}</span>
                </li>
              ))
          ) : (
            <li>
              <strong>Mission live</strong>
              <span>Awaiting the first emergency response.</span>
            </li>
          )}
        </ol>
      </section>
    </div>
  );
}
