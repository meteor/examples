import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { FileText, Home as HomeIcon } from 'lucide-react';
import { App as KonstaApp, Block } from 'konsta/react';
import { ACTIVE_STATUSES, TERMINAL_STATUSES, Games } from '../api/games/collection';
import { AppShell } from './components/AppShell';
import { HcpUpdateDialog, HcpUpdateReminder } from './components/HcpUpdateDialog';
import { LiveMatchSheet } from './components/LiveMatchSheet';
import { MatchResultSheet } from './components/MatchResultSheet';
import { MatchStage } from './components/MatchStage';
import { getClientIdentity } from './identity';
import {
  shouldCloseMatchExitDialog,
  shouldRevealActiveMatch,
} from './matchState';
import {
  NATIVE_BACK_ACTIONS,
  exitNativeApp,
  resolveNativeBackAction,
  useNativeBackButton,
} from './native/backButton';
import { signalMatchFeedback } from './native/haptics';
import { shareResult } from './native/share';
import { PlayPage } from './pages/PlayPage';
import { RecordsPage } from './pages/RecordsPage';
import { SystemInfoPage } from './pages/SystemInfoPage';
import { useDialogFocusTrap } from './useDialogFocusTrap';
import { useNativeDiagnostics } from './useNativeDiagnostics';

function getTestMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('testMode') === '1';
}

function getPlayerRole(game, playerId) {
  return game?.players?.find((player) => player.id === playerId)?.role ?? null;
}

function buildFeedbackKey(game) {
  if (!game?.lastMove) {
    return null;
  }

  return [
    game._id,
    game.status,
    game.lastMove.now,
    game.lastMove.index,
  ].join(':');
}

function MatchExitDialog({ opened, onStay, onLeave }) {
  const { dialogRef, onDialogKeyDown } = useDialogFocusTrap({
    opened,
    onDismiss: onStay,
  });

  if (!opened) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onStay}>
      <section
        className="dialog-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-exit-title"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dialog-sheet__header">
          <p className="eyebrow">Match in progress</p>
          <h2 id="match-exit-title">Return to Play screen?</h2>
        </header>
        <p className="dialog-sheet__detail">
          Match stays live in background. Resume from Play anytime.
        </p>
        <div className="dialog-sheet__actions">
          <button
            className="dialog-sheet__button"
            type="button"
            onClick={onStay}
          >
            Stay in Match
          </button>
          <button
            className="dialog-sheet__button dialog-sheet__button--primary"
            type="button"
            onClick={onLeave}
          >
            Return to Play
          </button>
        </div>
      </section>
    </div>
  );
}

export function App() {
  const identity = useMemo(() => getClientIdentity(), []);
  const testMode = useMemo(() => getTestMode(), []);
  const [view, setView] = useState('play');
  const [busyAction, setBusyAction] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [liveSheetMode, setLiveSheetMode] = useState(null);
  const [liveSheetOpen, setLiveSheetOpen] = useState(false);
  const [liveRoomCode, setLiveRoomCode] = useState('');
  const [liveError, setLiveError] = useState('');
  const [liveGameId, setLiveGameId] = useState(null);
  const [matchGameId, setMatchGameId] = useState(null);
  const [matchVisible, setMatchVisible] = useState(false);
  const [matchExitConfirmOpen, setMatchExitConfirmOpen] = useState(false);
  const [resultSheetOpen, setResultSheetOpen] = useState(false);
  const feedbackKeyRef = useRef(null);
  const seenResultRef = useRef(null);
  const revealedActiveGameIdRef = useRef(null);
  const {
    appInfo,
    dark,
    ddpEnabled,
    ddpEndpoint,
    hcp,
    networkStatus,
    onReconnect,
    onToggleDdp,
    theme,
  } = useNativeDiagnostics();

  const {
    connection,
    activeReady,
    recentReady,
    activeGame,
    recentGames,
  } = useTracker(() => {
    const activeHandle = Meteor.subscribe(
      'games.active',
      identity.ownerId,
      identity.playerId
    );
    const recentHandle = Meteor.subscribe('games.recent', identity.ownerId);

    return {
      connection: Meteor.status(),
      activeReady: activeHandle.ready(),
      recentReady: recentHandle.ready(),
      activeGame: Games.findOne(
        {
          players: {
            $elemMatch: {
              id: identity.playerId,
              ownerId: identity.ownerId,
            },
          },
          status: { $in: ACTIVE_STATUSES },
        },
        { sort: { updatedAt: -1 } }
      ),
      recentGames: Games.find(
        {
          ownerIds: identity.ownerId,
          status: { $in: TERMINAL_STATUSES },
        },
        { sort: { updatedAt: -1 } }
      ).fetch(),
    };
  }, [identity.ownerId, identity.playerId]);

  const resultGame = useMemo(() => {
    if (!matchGameId) {
      return null;
    }

    return recentGames.find((game) => game._id === matchGameId) ?? null;
  }, [matchGameId, recentGames]);

  const waitingLiveGame =
    activeGame?.mode === 'live' && activeGame?.status === 'waiting'
      ? activeGame
      : null;
  const livePlayingGame = activeGame?.status === 'playing' ? activeGame : null;
  const matchSnapshot = livePlayingGame ?? resultGame ?? null;
  const hasMatchSnapshot = Boolean(livePlayingGame) || Boolean(resultGame);
  const showMatch = matchVisible && hasMatchSnapshot;
  const roomWaiting = Boolean(
    waitingLiveGame?._id || (liveGameId && liveRoomCode)
  );
  const hasBackgroundMatch = hasMatchSnapshot && !matchVisible;
  const linkReady = networkStatus.connected && ddpEnabled && connection.connected;
  const homeControlsDisabled = !linkReady;

  const wins = recentGames.filter((game) => {
    const playerRole = getPlayerRole(game, identity.playerId);
    return game.status === 'won' && game.winner === playerRole;
  }).length;
  const draws = recentGames.filter((game) => game.status === 'draw').length;
  const homeStatusMessage =
    statusMessage ||
    (hasBackgroundMatch ? 'Active match running in background.' : '') ||
    (roomWaiting && !liveSheetOpen ? 'Live room waiting in background.' : '');

  useEffect(() => {
    if (
      !shouldRevealActiveMatch({
        activeGameId: activeGame?._id,
        activeGameStatus: activeGame?.status,
        revealedGameId: revealedActiveGameIdRef.current,
      })
    ) {
      return;
    }

    revealedActiveGameIdRef.current = activeGame._id;
    setMatchGameId(activeGame._id);
    setMatchVisible(true);
  }, [activeGame?._id, activeGame?.status]);

  useEffect(() => {
    if (!waitingLiveGame?._id) {
      return;
    }

    setLiveRoomCode(waitingLiveGame.roomCode ?? '');
    setLiveGameId(waitingLiveGame._id);
  }, [waitingLiveGame?._id, waitingLiveGame?.roomCode]);

  useEffect(() => {
    if (
      !liveSheetOpen ||
      activeGame?._id !== liveGameId ||
      activeGame?.status !== 'playing'
    ) {
      return;
    }

    setLiveSheetOpen(false);
    setLiveSheetMode(null);
    setLiveError('');
    setLiveRoomCode('');
    setLiveGameId(null);
    setView('play');
  }, [activeGame?._id, activeGame?.status, liveGameId, liveSheetOpen]);

  useEffect(() => {
    if (resultGame?._id !== liveGameId) {
      return;
    }

    setLiveRoomCode('');
    setLiveGameId(null);
    setLiveError('');
  }, [liveGameId, resultGame?._id]);

  useEffect(() => {
    if (
      matchExitConfirmOpen &&
      shouldCloseMatchExitDialog({
        liveMatchId: livePlayingGame?._id ?? null,
        resultMatchId: resultGame?._id ?? null,
      })
    ) {
      setMatchExitConfirmOpen(false);
    }
  }, [livePlayingGame?._id, matchExitConfirmOpen, resultGame?._id]);

  useEffect(() => {
    if (!resultGame?._id || seenResultRef.current === resultGame._id) {
      return;
    }

    seenResultRef.current = resultGame._id;
    setMatchExitConfirmOpen(false);
    setMatchVisible(true);
    setResultSheetOpen(true);
  }, [resultGame]);

  useEffect(() => {
    const key = buildFeedbackKey(matchSnapshot);
    if (!key || feedbackKeyRef.current === key) {
      return;
    }

    feedbackKeyRef.current = key;
    if (matchSnapshot.status === 'won') {
      const playerRole = getPlayerRole(matchSnapshot, identity.playerId);
      void signalMatchFeedback(
        matchSnapshot.winner === playerRole ? 'win' : 'loss'
      );
      return;
    }

    void signalMatchFeedback('move');
  }, [identity.playerId, matchSnapshot]);

  useNativeBackButton(() => {
    const action = resolveNativeBackAction({
      hcpDialogOpen: hcp.opened,
      liveMatchSheetOpen: liveSheetOpen,
      resultSheetOpen,
      matchExitConfirmOpen,
      hasActiveMatch: showMatch,
      view: showMatch ? 'match' : view,
    });

    switch (action) {
      case NATIVE_BACK_ACTIONS.DISMISS_HCP_DIALOG:
        hcp.onDismiss();
        return;
      case NATIVE_BACK_ACTIONS.DISMISS_LIVE_MATCH_SHEET:
        setLiveSheetOpen(false);
        setLiveError('');
        return;
      case NATIVE_BACK_ACTIONS.DISMISS_RESULT_SHEET:
        setResultSheetOpen(false);
        return;
      case NATIVE_BACK_ACTIONS.DISMISS_MATCH_CONFIRMATION:
        setMatchExitConfirmOpen(false);
        return;
      case NATIVE_BACK_ACTIONS.CONFIRM_ACTIVE_MATCH:
        setMatchExitConfirmOpen(true);
        return;
      case NATIVE_BACK_ACTIONS.GO_TO_PLAY:
        setView('play');
        return;
      case NATIVE_BACK_ACTIONS.EXIT_APP:
      default:
        void exitNativeApp();
    }
  });

  const invokeGameMethod = useCallback(
    async (actionName, callback, { onSuccess, onError } = {}) => {
      setBusyAction(actionName);
      setStatusMessage('');

      try {
        const result = await callback();
        onSuccess?.(result);
        return result;
      } catch (error) {
        const message = error.reason || error.message || 'Match command failed.';
        onError?.(message, error);
        if (!onError) {
          setStatusMessage(message);
        }
        return null;
      } finally {
        setBusyAction(null);
      }
    },
    []
  );

  const startCpuMatch = useCallback(() => {
    return invokeGameMethod(
      'cpu',
      () =>
        Meteor.callAsync('games.startSolo', {
          ownerId: identity.ownerId,
          playerId: identity.playerId,
          testMode,
        }),
      {
        onSuccess: ({ gameId }) => {
          setMatchGameId(gameId);
          setMatchVisible(true);
          setResultSheetOpen(false);
          setView('play');
        },
      }
    );
  }, [identity.ownerId, identity.playerId, invokeGameMethod, testMode]);

  const handleCreateLiveMatch = useCallback(() => {
    setLiveSheetMode('create');
    setLiveSheetOpen(true);
    setLiveError('');
    setStatusMessage('');
    setView('play');

    if (waitingLiveGame?._id) {
      setLiveRoomCode(waitingLiveGame.roomCode ?? '');
      setLiveGameId(waitingLiveGame._id);
      return Promise.resolve({
        gameId: waitingLiveGame._id,
        roomCode: waitingLiveGame.roomCode,
      });
    }

    if (liveGameId && liveRoomCode) {
      return Promise.resolve({ gameId: liveGameId, roomCode: liveRoomCode });
    }

    return invokeGameMethod(
      'create-live',
      () =>
        Meteor.callAsync('games.createLiveMatch', {
          ownerId: identity.ownerId,
          playerId: identity.playerId,
        }),
      {
        onSuccess: ({ gameId, roomCode }) => {
          setLiveRoomCode(roomCode);
          setLiveGameId(gameId);
          setMatchGameId(gameId);
          setMatchVisible(false);
          setResultSheetOpen(false);
        },
        onError: setLiveError,
      }
    );
  }, [
    identity.ownerId,
    identity.playerId,
    invokeGameMethod,
    liveGameId,
    liveRoomCode,
    waitingLiveGame?._id,
    waitingLiveGame?.roomCode,
  ]);

  const handleJoinLiveMatch = useCallback(
    (roomCode) => {
      return invokeGameMethod(
        'join-live',
        () =>
          Meteor.callAsync('games.joinLiveMatch', {
            ownerId: identity.ownerId,
            playerId: identity.playerId,
            roomCode,
          }),
        {
          onSuccess: ({ gameId }) => {
            setMatchGameId(gameId);
            setLiveGameId(gameId);
            setLiveError('');
            setMatchVisible(true);
            setResultSheetOpen(false);
          },
          onError: setLiveError,
        }
      );
    },
    [identity.ownerId, identity.playerId, invokeGameMethod]
  );

  const handleOpenJoinLiveMatch = useCallback(() => {
    setLiveSheetMode('join');
    setLiveSheetOpen(true);
    setLiveError('');
    setStatusMessage('');
    setView('play');
  }, []);

  const handleDrop = useCallback(
    (column) => {
      if (!activeGame?._id) {
        return Promise.resolve(null);
      }

      return invokeGameMethod('drop', () =>
        Meteor.callAsync('games.dropMeteor', {
          ownerId: identity.ownerId,
          playerId: identity.playerId,
          gameId: activeGame._id,
          column,
        })
      );
    },
    [activeGame?._id, identity.ownerId, identity.playerId, invokeGameMethod]
  );

  const handleRematch = useCallback(() => {
    if (!resultGame?._id) {
      return Promise.resolve(null);
    }

    return invokeGameMethod(
      'rematch',
      () =>
        Meteor.callAsync('games.rematch', {
          ownerId: identity.ownerId,
          playerId: identity.playerId,
          gameId: resultGame._id,
          testMode,
        }),
      {
        onSuccess: ({ gameId }) => {
          setMatchGameId(gameId);
          setMatchVisible(true);
          setResultSheetOpen(false);
        },
      }
    );
  }, [identity.ownerId, identity.playerId, invokeGameMethod, resultGame?._id, testMode]);

  const handleResultHome = useCallback(() => {
    setResultSheetOpen(false);
    setMatchGameId(null);
    setMatchVisible(false);
    setView('play');
  }, []);

  const handleResumeMatch = useCallback(() => {
    setMatchExitConfirmOpen(false);
    setMatchVisible(true);
    setView('play');
  }, []);

  const handleLeaveMatchToPlay = useCallback(() => {
    setMatchExitConfirmOpen(false);
    setMatchVisible(false);
    setView('play');
  }, []);

  const shellView = showMatch ? 'match' : view;

  return (
    <KonstaApp
      theme={theme}
      dark={dark}
      safeAreas
      iosHoverHighlight
      materialTouchRipple
    >
      <AppShell
        view={shellView}
        onNavigate={setView}
        connection={{
          ...connection,
          ddpEnabled,
          networkStatus,
        }}
      >
        {!activeReady && view === 'play' && !activeGame ? (
          <Block strong className="records-empty">
            <h1>Preparing live board</h1>
            <p>Connecting Meteor data.</p>
          </Block>
        ) : null}

        {showMatch && matchSnapshot ? (
          <>
            <MatchStage
              game={matchSnapshot}
              playerId={identity.playerId}
              busy={busyAction === 'drop'}
              connected={linkReady}
              onDrop={handleDrop}
            />
            {resultGame && !resultSheetOpen ? (
              <section className="match-terminal-actions" aria-label="Finished match actions">
                <button
                  className="match-terminal-actions__button match-terminal-actions__button--primary"
                  type="button"
                  onClick={() => setResultSheetOpen(true)}
                >
                  <FileText aria-hidden="true" size={18} strokeWidth={2.3} />
                  <span>View result</span>
                </button>
                <button
                  className="match-terminal-actions__button"
                  type="button"
                  aria-label="Match home"
                  onClick={handleResultHome}
                >
                  <HomeIcon aria-hidden="true" size={18} strokeWidth={2.3} />
                  <span>Home</span>
                </button>
              </section>
            ) : null}
            {resultGame ? (
              <MatchResultSheet
                game={resultGame}
                playerId={identity.playerId}
                opened={resultSheetOpen}
                rematching={busyAction === 'rematch'}
                onRematch={handleRematch}
                onShare={() => shareResult(resultGame, identity.playerId)}
                onHome={handleResultHome}
                onClose={() => setResultSheetOpen(false)}
              />
            ) : null}
          </>
        ) : null}

        {!showMatch && view === 'play' ? (
          <>
            <PlayPage
              wins={wins}
              draws={draws}
              onPlayCpu={startCpuMatch}
              onResumeMatch={handleResumeMatch}
              onCreateLiveMatch={handleCreateLiveMatch}
              onJoinLiveMatch={handleOpenJoinLiveMatch}
              primaryActionLabel={hasBackgroundMatch ? 'Resume Match' : 'Play vs CPU'}
              busyAction={busyAction}
              roomWaiting={roomWaiting}
              controlsDisabled={homeControlsDisabled}
              hasBackgroundMatch={hasBackgroundMatch}
              statusMessage={homeStatusMessage}
            />
            <LiveMatchSheet
              mode={liveSheetMode}
              opened={liveSheetOpen}
              roomCode={liveRoomCode}
              busy={busyAction === 'create-live' || busyAction === 'join-live'}
              disabled={homeControlsDisabled}
              error={liveError}
              onCreate={handleCreateLiveMatch}
              onJoin={handleJoinLiveMatch}
              onClose={() => {
                setLiveSheetOpen(false);
                setLiveError('');
              }}
            />
          </>
        ) : null}

        {view === 'records' && !showMatch ? (
          <RecordsPage
            games={recentGames}
            playerId={identity.playerId}
            ready={recentReady}
            onPlay={hasBackgroundMatch ? handleResumeMatch : startCpuMatch}
            actionLabel={hasBackgroundMatch ? 'Resume Match' : 'Play'}
            disabled={hasBackgroundMatch ? false : homeControlsDisabled}
          />
        ) : null}

        {view === 'system' && !showMatch ? (
          <SystemInfoPage
            appInfo={appInfo}
            ddpEnabled={ddpEnabled}
            ddpEndpoint={ddpEndpoint}
            ddpStatus={connection.status}
            hcp={hcp}
            onReconnect={onReconnect}
            onToggleDdp={onToggleDdp}
          />
        ) : null}
      </AppShell>

      <HcpUpdateReminder
        visible={Boolean(hcp.updateVersion) && !hcp.opened && !showMatch}
        onReview={hcp.onReview}
      />
      <HcpUpdateDialog
        installing={hcp.installing}
        opened={hcp.opened}
        updateVersion={hcp.updateVersion}
        onDismiss={hcp.onDismiss}
        onInstall={hcp.onInstall}
      />
      <MatchExitDialog
        opened={matchExitConfirmOpen}
        onStay={() => setMatchExitConfirmOpen(false)}
        onLeave={handleLeaveMatchToPlay}
      />
    </KonstaApp>
  );
}
