import React, { useMemo, useState } from 'react';
import {
  Badge,
  Block,
  BlockTitle,
  Button,
  List,
  ListItem,
  Progressbar,
} from 'konsta/react';
import { Shield, TimerReset, Users, Zap } from 'lucide-react';
import { FlightDeckArt } from '../art/FlightDeckArt';

function formatTurn(turn) {
  return turn === 'copilot' ? 'Copilot turn' : 'Captain turn';
}

function formatMode(mode) {
  return mode === 'crew' ? 'Crew Mission' : 'Quick Mission';
}

function formatTimeRemaining(game) {
  if (!game?.endsAt) {
    return null;
  }

  const seconds = Math.max(0, Math.ceil((game.endsAt - Date.now()) / 1000));
  return `${seconds}s`;
}

export function PlayPage({
  bestScore,
  activeGame,
  onQuickMission,
  onCreateCrew,
  onJoinCrew,
  busyAction,
  statusMessage,
}) {
  const [roomCode, setRoomCode] = useState('');

  const missionTime = useMemo(() => formatTimeRemaining(activeGame), [activeGame]);

  if (activeGame) {
    return (
      <div className="mission-focus">
        <div className="mission-focus__header">
          <div>
            <p className="eyebrow">{formatMode(activeGame.mode)}</p>
            <h1 className="mission-focus__title">
              {activeGame.status === 'waiting' ? 'Crew lobby ready' : 'Mission in progress'}
            </h1>
          </div>
          <Badge colors={activeGame.status === 'waiting' ? 'blue' : 'green'}>
            {activeGame.status === 'waiting' ? 'Waiting' : formatTurn(activeGame.turn)}
          </Badge>
        </div>

        <div className="mission-focus__surface">
          <FlightDeckArt />

          <div className="mission-focus__stats" aria-label="Mission status">
            <div className="mission-stat">
              <div className="mission-stat__label">
                <Shield aria-hidden="true" size={16} />
                <span>Shield</span>
              </div>
              <strong>{activeGame.shield}%</strong>
              <Progressbar value={activeGame.shield} />
            </div>

            <div className="mission-stat">
              <div className="mission-stat__label">
                <Zap aria-hidden="true" size={16} />
                <span>Warp</span>
              </div>
              <strong>{activeGame.warp}%</strong>
              <Progressbar value={activeGame.warp} />
            </div>

            <div className="mission-stat">
              <div className="mission-stat__label">
                <TimerReset aria-hidden="true" size={16} />
                <span>Mission clock</span>
              </div>
              <strong>{missionTime ?? 'Live'}</strong>
              <span className="mission-stat__detail">
                Emergency: {activeGame.emergency}
              </span>
            </div>

            <div className="mission-stat">
              <div className="mission-stat__label">
                <Users aria-hidden="true" size={16} />
                <span>Crew</span>
              </div>
              <strong>{activeGame.players.length} aboard</strong>
              <span className="mission-stat__detail">
                {activeGame.roomCode ? `Room ${activeGame.roomCode}` : 'CPU copilot online'}
              </span>
            </div>
          </div>
        </div>

        {activeGame.status === 'waiting' ? (
          <Block strong className="mission-waiting">
            <BlockTitle className="mission-waiting__title">Invite a copilot</BlockTitle>
            <p className="mission-waiting__copy">
              Share room code <strong>{activeGame.roomCode}</strong> to swap the CPU for a live
              crew member.
            </p>
          </Block>
        ) : (
          <List inset strong className="mission-feed">
            {activeGame.events.length > 0 ? (
              activeGame.events
                .slice()
                .reverse()
                .map((event, index) => (
                  <ListItem
                    key={`${event.now}-${index}`}
                    title={`${event.emergency} ${event.outcome}`}
                    after={event.action ?? 'timeout'}
                    subtitle={event.actorId ? `Actor ${event.actorId.slice(0, 6)}` : 'System'}
                  />
                ))
            ) : (
              <ListItem
                title="Crew standing by"
                subtitle="Action feed fills as turns resolve."
              />
            )}
          </List>
        )}
      </div>
    );
  }

  return (
    <div className="play-home">
      <section className="play-home__hero" aria-labelledby="meteor-escape-home-title">
        <div className="play-home__copy">
          <p className="eyebrow">Reactive co-op microgame</p>
          <h1 id="meteor-escape-home-title">Meteor Escape</h1>
          <p className="play-home__tagline">Charge warp before shields fail.</p>
          <p className="play-home__objective">
            React to meteor, overheating, and clear-path alerts fast enough to punch through the
            field in under sixty seconds.
          </p>

          <div className="play-home__badges" aria-label="Mission summary">
            <span className="summary-pill">
              <Zap aria-hidden="true" size={15} />
              Best score {bestScore}
            </span>
            <span className="summary-pill">
              <Users aria-hidden="true" size={15} />
              Solo now, crew optional
            </span>
          </div>
        </div>

        <div className="play-home__media">
          <img
            className="play-home__key-art"
            src="/images/meteor-escape-key-art.webp"
            alt="Meteor Escape key art"
          />
          <FlightDeckArt />
        </div>
      </section>

      <section className="play-home__actions" aria-label="Start a mission">
        <Button
          large
          tonal={false}
          className="primary-action"
          onClick={onQuickMission}
          disabled={busyAction !== null}
        >
          Quick Mission
        </Button>

        <div className="crew-actions">
          <Button
            className="secondary-action"
            onClick={onCreateCrew}
            disabled={busyAction !== null}
          >
            Create Crew Mission
          </Button>

          <div className="join-crew-inline">
            <label className="join-crew-inline__label" htmlFor="room-code">
              Room code
            </label>
            <div className="join-crew-inline__controls">
              <input
                id="room-code"
                className="join-crew-inline__input"
                type="text"
                inputMode="text"
                value={roomCode}
                placeholder="ABC123"
                autoCapitalize="characters"
                onInput={(event) => {
                  const nextValue = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setRoomCode(nextValue.slice(0, 6));
                }}
              />
              <Button
                className="join-crew-inline__button"
                onClick={() => onJoinCrew(roomCode)}
                disabled={busyAction !== null || roomCode.length !== 6}
              >
                Join Crew
              </Button>
            </div>
            <p className="join-crew-inline__hint">Replace the CPU with a second human.</p>
          </div>
        </div>

        {statusMessage ? (
          <p className="play-home__status" role="status" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}
      </section>
    </div>
  );
}
