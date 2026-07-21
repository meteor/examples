import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Share2, Users, X } from 'lucide-react';
import { Button, Sheet } from 'konsta/react';
import { shareCrewRoom } from '../native/share';

const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

function normalizeRoomCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function getInlineError(value) {
  if (value.length === 0) {
    return '';
  }

  if (value.length < 6) {
    return 'Enter a six-character room code.';
  }

  if (!ROOM_CODE_PATTERN.test(value)) {
    return 'Use only letters A-H, J-N, P-Z, and digits 2-9.';
  }

  return '';
}

export function CrewSheet({
  mode,
  opened,
  roomCode,
  busy,
  disabled,
  error,
  onCreate,
  onJoin,
  onClose,
}) {
  const [joinCode, setJoinCode] = useState('');
  const [joinTouched, setJoinTouched] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (!opened) {
      return;
    }

    setShareBusy(false);
    setShareMessage('');

    if (mode === 'join') {
      setJoinCode('');
      setJoinTouched(false);
    }
  }, [mode, opened]);

  const inlineError = useMemo(() => getInlineError(joinCode), [joinCode]);
  const createReady = mode === 'create' && roomCode.length === 6;
  const title = mode === 'create' ? 'Create Crew Mission' : 'Join Crew Mission';
  const describedBy = mode === 'create' ? 'crew-sheet-create-detail' : 'crew-sheet-join-detail';

  if (!opened || !mode) {
    return null;
  }

  return (
    <Sheet
      opened={opened}
      backdrop
      onBackdropClick={busy || shareBusy ? undefined : onClose}
      className="crew-sheet-frame"
    >
      <section
        className="crew-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crew-sheet-title"
        aria-describedby={describedBy}
      >
        <div className="crew-sheet__header">
          <div>
            <p className="eyebrow">Crew mission</p>
            <h2 id="crew-sheet-title">{title}</h2>
          </div>
          <button
            className="crew-sheet__icon-button"
            type="button"
            onClick={onClose}
            aria-label={mode === 'create' ? 'Hide Crew Room' : 'Dismiss Join Crew Mission'}
            disabled={busy || shareBusy}
          >
            <X aria-hidden="true" size={18} strokeWidth={2.4} />
          </button>
        </div>

        {mode === 'create' ? (
          <div className="crew-sheet__body">
            <p id="crew-sheet-create-detail" className="crew-sheet__detail">
              Create a six-character room, share it, then wait here until your copilot joins.
            </p>

            {createReady ? (
              <>
                <div className="crew-sheet__code-block" aria-live="polite">
                  <span className="crew-sheet__code-label">Room code</span>
                  <strong>{roomCode}</strong>
                </div>
                <div className="crew-sheet__waiting" role="status" aria-live="polite">
                  <Users aria-hidden="true" size={18} strokeWidth={2.2} />
                  <span>Waiting for a live copilot. Mission opens automatically when they join.</span>
                </div>
              </>
            ) : (
              <div className="crew-sheet__loading" role="status" aria-live="polite">
                <LoaderCircle className="crew-sheet__spinner" aria-hidden="true" size={18} strokeWidth={2.2} />
                <span>{busy ? 'Generating room code' : 'Room creation paused.'}</span>
              </div>
            )}

            {error ? <p className="crew-sheet__error">{error}</p> : null}
            {shareMessage ? <p className="crew-sheet__message">{shareMessage}</p> : null}

            <div className="crew-sheet__actions">
              {createReady ? (
                <Button
                  type="button"
                  className="crew-sheet__button crew-sheet__button--primary"
                  tonal={false}
                  onClick={async () => {
                    setShareBusy(true);
                    try {
                      const result = await shareCrewRoom(roomCode);
                      if (result.shared) {
                        setShareMessage('Share sheet opened.');
                      } else if (result.copied) {
                        setShareMessage('Crew room copied.');
                      } else {
                        setShareMessage('Share unavailable on this device.');
                      }
                    } finally {
                      setShareBusy(false);
                    }
                  }}
                  disabled={shareBusy}
                >
                  <Share2 aria-hidden="true" size={18} strokeWidth={2.25} />
                  {shareBusy ? 'Sharing' : 'Share Crew Code'}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="crew-sheet__button crew-sheet__button--primary"
                  tonal={false}
                  onClick={onCreate}
                  disabled={busy || disabled}
                >
                  {busy ? 'Creating Room' : 'Create Crew Room'}
                </Button>
              )}

              <Button
                type="button"
                className="crew-sheet__button"
                onClick={onClose}
                disabled={busy || shareBusy}
              >
                Keep Waiting in Background
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="crew-sheet__body"
            onSubmit={(event) => {
              event.preventDefault();
              setJoinTouched(true);

              if (inlineError) {
                return;
              }

              void onJoin(joinCode);
            }}
          >
            <p id="crew-sheet-join-detail" className="crew-sheet__detail">
              Enter the shared room code to replace the CPU with another human.
            </p>

            <div className="crew-sheet__field">
              <label className="crew-sheet__label" htmlFor="crew-room-code">
                Room code
              </label>
              <input
                id="crew-room-code"
                className="crew-sheet__input"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                placeholder="ABC234"
                value={joinCode}
                disabled={busy}
                onChange={(event) => {
                  setJoinCode(normalizeRoomCode(event.target.value));
                }}
                onBlur={() => setJoinTouched(true)}
                aria-invalid={joinTouched && inlineError ? 'true' : 'false'}
              />
            </div>

            {joinTouched && inlineError ? <p className="crew-sheet__error">{inlineError}</p> : null}
            {error ? <p className="crew-sheet__error">{error}</p> : null}

            <div className="crew-sheet__actions">
              <Button
                type="submit"
                className="crew-sheet__button crew-sheet__button--primary"
                tonal={false}
                disabled={busy || disabled}
              >
                {busy ? 'Joining' : 'Join Mission'}
              </Button>
              <Button type="button" className="crew-sheet__button" onClick={onClose} disabled={busy}>
                Close Join Crew Mission
              </Button>
            </div>
          </form>
        )}
      </section>
    </Sheet>
  );
}
