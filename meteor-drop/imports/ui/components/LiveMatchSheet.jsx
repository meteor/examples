import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Share2, Users, X } from 'lucide-react';
import { Button, Sheet } from 'konsta/react';
import { shareLiveMatchRoom } from '../native/share';
import { useDialogFocusTrap } from '../useDialogFocusTrap';

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
    return 'Use letters A-H, J-N, P-Z, and digits 2-9.';
  }

  return '';
}

export function LiveMatchSheet({
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
  const { dialogRef, onDialogKeyDown } = useDialogFocusTrap({
    opened: opened && Boolean(mode),
    onDismiss: onClose,
    dismissDisabled: busy || shareBusy,
  });

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
  const roomReady = mode === 'create' && roomCode.length === 6;
  const title = mode === 'create' ? 'Create Live Match' : 'Join Live Match';

  if (!opened || !mode) {
    return null;
  }

  return (
    <Sheet
      opened={opened}
      backdrop
      onBackdropClick={busy || shareBusy ? undefined : onClose}
      className="live-match-sheet-frame"
    >
      <section
        className="live-match-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-match-sheet-title"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
      >
        <header className="live-match-sheet__header">
          <div>
            <p className="eyebrow">Two-player board</p>
            <h2 id="live-match-sheet-title">{title}</h2>
          </div>
          <button
            className="live-match-sheet__close"
            type="button"
            aria-label="Close live match"
            onClick={onClose}
            disabled={busy || shareBusy}
          >
            <X aria-hidden="true" size={22} strokeWidth={2.4} />
          </button>
        </header>

        {mode === 'create' ? (
          <div className="live-match-sheet__body">
            <p>
              Share room code. Board opens when rival joins.
            </p>

            {roomReady ? (
              <>
                <div className="live-match-sheet__code" aria-live="polite">
                  <span>Room code</span>
                  <strong>{roomCode}</strong>
                </div>
                <div className="live-match-sheet__waiting" role="status">
                  <Users aria-hidden="true" size={19} strokeWidth={2.2} />
                  Waiting for rival
                </div>
              </>
            ) : (
              <div className="live-match-sheet__waiting" role="status">
                <LoaderCircle
                  className="live-match-sheet__spinner"
                  aria-hidden="true"
                  size={19}
                  strokeWidth={2.2}
                />
                {busy ? 'Creating room' : 'Room creation paused'}
              </div>
            )}

            {error ? <p className="live-match-sheet__error">{error}</p> : null}
            {shareMessage ? (
              <p className="live-match-sheet__message">{shareMessage}</p>
            ) : null}

            <div className="live-match-sheet__actions">
              {roomReady ? (
                <Button
                  className="live-match-sheet__button live-match-sheet__button--primary"
                  tonal={false}
                  onClick={async () => {
                    setShareBusy(true);
                    try {
                      const result = await shareLiveMatchRoom(roomCode);
                      setShareMessage(
                        result.shared
                          ? 'Share sheet opened.'
                          : result.copied
                            ? 'Room code copied.'
                            : 'Sharing unavailable.'
                      );
                    } finally {
                      setShareBusy(false);
                    }
                  }}
                  disabled={shareBusy}
                >
                  <Share2 aria-hidden="true" size={19} strokeWidth={2.25} />
                  {shareBusy ? 'Sharing' : 'Share Room Code'}
                </Button>
              ) : (
                <Button
                  className="live-match-sheet__button live-match-sheet__button--primary"
                  tonal={false}
                  onClick={onCreate}
                  disabled={busy || disabled}
                >
                  {busy ? 'Creating Room' : 'Create Room'}
                </Button>
              )}
              <Button
                className="live-match-sheet__button"
                onClick={onClose}
                disabled={busy || shareBusy}
              >
                Keep Waiting in Background
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="live-match-sheet__body"
            onSubmit={(event) => {
              event.preventDefault();
              setJoinTouched(true);
              if (!inlineError && joinCode.length === 6) {
                void onJoin(joinCode);
              }
            }}
          >
            <p>Enter rival's room code. Moves sync live through Meteor.</p>
            <label className="live-match-sheet__field" htmlFor="live-room-code">
              <span>Room code</span>
              <input
                id="live-room-code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                placeholder="ABC234"
                value={joinCode}
                disabled={busy}
                aria-invalid={joinTouched && inlineError ? 'true' : 'false'}
                onChange={(event) => setJoinCode(normalizeRoomCode(event.target.value))}
                onBlur={() => setJoinTouched(true)}
              />
            </label>

            {joinTouched && inlineError ? (
              <p className="live-match-sheet__error">{inlineError}</p>
            ) : null}
            {error ? <p className="live-match-sheet__error">{error}</p> : null}

            <div className="live-match-sheet__actions">
              <Button
                type="submit"
                className="live-match-sheet__button live-match-sheet__button--primary"
                tonal={false}
                disabled={busy || disabled}
              >
                {busy ? 'Joining' : 'Join Match'}
              </Button>
              <Button
                type="button"
                className="live-match-sheet__button"
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>
    </Sheet>
  );
}
