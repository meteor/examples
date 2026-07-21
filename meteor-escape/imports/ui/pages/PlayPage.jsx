import React from 'react';
import { Button } from 'konsta/react';
import { Users, Zap } from 'lucide-react';
import { FlightDeckArt } from '../art/FlightDeckArt';

export function PlayPage({
  bestScore,
  onQuickMission,
  onResumeMission,
  onCreateCrew,
  onJoinCrew,
  createCrewLabel,
  primaryActionLabel,
  busyAction,
  crewWaiting,
  controlsDisabled,
  hasBackgroundMission,
  statusMessage,
}) {
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
          onClick={hasBackgroundMission ? onResumeMission : onQuickMission}
          disabled={hasBackgroundMission ? false : busyAction !== null || crewWaiting || controlsDisabled}
        >
          {primaryActionLabel}
        </Button>

        <div className="crew-actions">
          <Button
            className="secondary-action"
            onClick={onCreateCrew}
            disabled={busyAction !== null || controlsDisabled || hasBackgroundMission}
          >
            {createCrewLabel}
          </Button>
          <Button
            className="secondary-action"
            onClick={onJoinCrew}
            disabled={busyAction !== null || crewWaiting || controlsDisabled || hasBackgroundMission}
          >
            Join Crew Mission
          </Button>
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
