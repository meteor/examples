import React, { useState } from 'react';
import { Button } from 'konsta/react';
import { Users, Zap } from 'lucide-react';
import { FlightDeckArt } from '../art/FlightDeckArt';

export function PlayPage({
  bestScore,
  onQuickMission,
  onCreateCrew,
  onJoinCrew,
  busyAction,
  statusMessage,
}) {
  const [roomCode, setRoomCode] = useState('');

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
