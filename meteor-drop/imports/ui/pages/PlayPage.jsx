import React from 'react';
import { Button } from 'konsta/react';
import { CircleDot, Radio, Trophy } from 'lucide-react';
import { MeteorDropArt } from '../art/MeteorDropArt';

export function PlayPage({
  wins,
  draws,
  onPlayCpu,
  onResumeMatch,
  onCreateLiveMatch,
  onJoinLiveMatch,
  primaryActionLabel,
  busyAction,
  roomWaiting,
  controlsDisabled,
  hasBackgroundMatch,
  statusMessage,
}) {
  return (
    <div className="play-home">
      <section className="play-home__hero" aria-labelledby="meteor-drop-home-title">
        <div className="play-home__copy">
          <p className="eyebrow">Live four-in-a-row</p>
          <h1 id="meteor-drop-home-title">Meteor Drop</h1>
          <p className="play-home__tagline">
            Connect four meteors before your rival.
          </p>
          <div className="play-home__rule" aria-label="How to play">
            <span><strong>1</strong> Tap column</span>
            <span><strong>2</strong> Meteor falls</span>
            <span><strong>3</strong> Connect four</span>
          </div>

          <div className="play-home__badges" aria-label="Match records">
            <span className="summary-pill">
              <Trophy aria-hidden="true" size={16} strokeWidth={2.3} />
              {wins} wins
            </span>
            <span className="summary-pill">
              <CircleDot aria-hidden="true" size={16} strokeWidth={2.3} />
              {draws} draws
            </span>
            <span className="summary-pill">
              <Radio aria-hidden="true" size={16} strokeWidth={2.3} />
              Live rooms
            </span>
          </div>

          <div className="play-home__actions" aria-label="Start match">
            <Button
              large
              tonal={false}
              className="primary-action"
              onClick={hasBackgroundMatch ? onResumeMatch : onPlayCpu}
              disabled={
                hasBackgroundMatch
                  ? false
                  : busyAction !== null || roomWaiting || controlsDisabled
              }
            >
              {primaryActionLabel}
            </Button>

            <div className="live-match-actions">
              <Button
                className="secondary-action"
                onClick={onCreateLiveMatch}
                disabled={busyAction !== null || controlsDisabled || hasBackgroundMatch}
              >
                {roomWaiting ? 'Open Live Room' : 'Create Live Match'}
              </Button>
              <Button
                className="secondary-action"
                onClick={onJoinLiveMatch}
                disabled={
                  busyAction !== null ||
                  roomWaiting ||
                  controlsDisabled ||
                  hasBackgroundMatch
                }
              >
                Join Live Match
              </Button>
            </div>

            {statusMessage ? (
              <p className="play-home__status" role="status" aria-live="polite">
                {statusMessage}
              </p>
            ) : null}
          </div>
        </div>

        <MeteorDropArt />
      </section>
    </div>
  );
}
