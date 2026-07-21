import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Capacitor } from '@capacitor/core';
import { FileText, Home as HomeIcon } from 'lucide-react';
import { App as KonstaApp, Block } from 'konsta/react';
import { ACTIVE_STATUSES, TERMINAL_STATUSES, Games } from '../api/games/collection';
import { AppShell } from './components/AppShell';
import { CrewSheet } from './components/CrewSheet';
import { MissionStage } from './components/MissionStage';
import { ResultSheet } from './components/ResultSheet';
import {
  NATIVE_BACK_ACTIONS,
  exitNativeApp,
  resolveNativeBackAction,
  useNativeBackButton,
} from './native/backButton';
import {
  HCP_PREVIEW_VERSION,
  applyHcpUpdate,
  checkForHcpUpdates,
  listenForHcpUpdates,
} from './native/hcp';
import { signalActionResult } from './native/haptics';
import { METEOR_ESCAPE_INFO, getApplicationInfo, getDdpEndpoint } from './native/appInfo';
import { getNetworkStatus, listenNetworkStatus } from './native/network';
import { shareResult } from './native/share';
import { getClientIdentity } from './identity';
import { shouldCloseMissionExitDialog, shouldRevealActiveGame } from './missionState';
import { useDialogFocusTrap } from './useDialogFocusTrap';
import { PlayPage } from './pages/PlayPage';
import { RecordsPage } from './pages/RecordsPage';
import { SystemInfoPage } from './pages/SystemInfoPage';

function pickTheme() {
  return Capacitor.getPlatform() === 'ios' ? 'ios' : 'material';
}

function getTestMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('testMode') === '1';
}

function buildFeedbackKey(game) {
  const latestEvent = game?.events?.at(-1);
  if (!game || !latestEvent) {
    return null;
  }

  return [
    game._id,
    game.status,
    latestEvent.now,
    latestEvent.actorId ?? 'system',
    latestEvent.action ?? 'timeout',
    latestEvent.outcome,
  ].join(':');
}

const browserAppInfo = {
  ...METEOR_ESCAPE_INFO,
  platform: 'web',
  native: false,
};

function MissionExitDialog({ opened, onStay, onLeave }) {
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
        aria-labelledby="meteor-mission-exit-title"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-sheet__header">
          <p className="eyebrow">Mission in progress</p>
          <h2 id="meteor-mission-exit-title">Leave the reactive mission view?</h2>
        </div>

        <p className="dialog-sheet__detail">
          The mission will keep running in the background. You can return from Play whenever you
          need the live cockpit again.
        </p>

        <div className="dialog-sheet__actions">
          <button className="dialog-sheet__button dialog-sheet__button--secondary" type="button" onClick={onStay}>
            Stay in Mission
          </button>
          <button className="dialog-sheet__button dialog-sheet__button--primary" type="button" onClick={onLeave}>
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
  const [crewSheetMode, setCrewSheetMode] = useState(null);
  const [crewSheetOpen, setCrewSheetOpen] = useState(false);
  const [crewRoomCode, setCrewRoomCode] = useState('');
  const [crewError, setCrewError] = useState('');
  const [crewGameId, setCrewGameId] = useState(null);
  const [dark, setDark] = useState(false);
  const [ddpEnabled, setDdpEnabled] = useState(true);
  const [appInfo, setAppInfo] = useState(browserAppInfo);
  const [networkStatus, setNetworkStatus] = useState({ connected: true, connectionType: 'wifi' });
  const [checkingHcp, setCheckingHcp] = useState(false);
  const [installingHcp, setInstallingHcp] = useState(false);
  const [hcpMessage, setHcpMessage] = useState('Ready to check for app updates.');
  const [hcpUpdateVersion, setHcpUpdateVersion] = useState(null);
  const [missionGameId, setMissionGameId] = useState(null);
  const [missionVisible, setMissionVisible] = useState(false);
  const [missionExitConfirmOpen, setMissionExitConfirmOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [resultSheetOpen, setResultSheetOpen] = useState(false);
  const seenResultRef = useRef(null);
  const feedbackKeyRef = useRef(null);
  const revealedActiveGameIdRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => setDark(mediaQuery.matches);

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);

    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, []);

  const { connection, activeReady, recentReady, activeGame, recentGames } = useTracker(() => {
    const activeHandle = Meteor.subscribe('games.active', identity.ownerId, identity.playerId);
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
    if (!missionGameId) {
      return null;
    }

    return recentGames.find((game) => game._id === missionGameId) ?? null;
  }, [missionGameId, recentGames]);

  const waitingCrewGame =
    activeGame?.mode === 'crew' && activeGame?.status === 'waiting' ? activeGame : null;
  const liveMissionGame = activeGame?.status === 'playing' ? activeGame : null;
  const missionSnapshot = liveMissionGame ?? resultGame ?? null;
  const hasMissionSnapshot = Boolean(liveMissionGame) || Boolean(resultGame);
  const showMission = missionVisible && hasMissionSnapshot;
  const hasWaitingCrewRoom = Boolean(waitingCrewGame?._id || (crewGameId && crewRoomCode));
  const hasBackgroundMission = hasMissionSnapshot && !missionVisible;
  const linkReady = networkStatus.connected && ddpEnabled && connection.connected;
  const homeControlsDisabled = !linkReady;

  const bestScore = recentGames.reduce(
    (highest, game) => Math.max(highest, Number(game.score) || 0),
    0
  );
  const homeStatusMessage =
    statusMessage ||
    (hasBackgroundMission
      ? 'Active mission running in the background.'
      : '') ||
    (hasWaitingCrewRoom && !crewSheetOpen
      ? 'Crew room remains open in the background.'
      : '');

  useEffect(() => {
    if (
      !shouldRevealActiveGame({
        activeGameId: activeGame?._id,
        activeGameStatus: activeGame?.status,
        revealedGameId: revealedActiveGameIdRef.current,
      })
    ) {
      return;
    }

    revealedActiveGameIdRef.current = activeGame._id;
    setMissionGameId(activeGame._id);
    setMissionVisible(true);
    setNow(Date.now());
  }, [activeGame?._id, activeGame?.status]);

  useEffect(() => {
    void getApplicationInfo().then(setAppInfo);
    void getNetworkStatus().then(setNetworkStatus).catch(() => {});
    return listenNetworkStatus(setNetworkStatus);
  }, []);

  useEffect(
    () =>
      listenForHcpUpdates((version) => {
        setHcpUpdateVersion(version);
        setHcpMessage(`Version ${version} downloaded and ready.`);
      }),
    []
  );

  useEffect(() => {
    if (!waitingCrewGame?._id) {
      return;
    }

    setCrewRoomCode(waitingCrewGame.roomCode ?? '');
    setCrewGameId(waitingCrewGame._id);
  }, [waitingCrewGame?._id, waitingCrewGame?.roomCode]);

  useEffect(() => {
    if (!crewSheetOpen || activeGame?._id !== crewGameId || activeGame?.status !== 'playing') {
      return;
    }

    setCrewSheetOpen(false);
    setCrewSheetMode(null);
    setCrewError('');
    setCrewRoomCode('');
    setCrewGameId(null);
    setView('play');
  }, [activeGame?._id, activeGame?.status, crewGameId, crewSheetOpen]);

  useEffect(() => {
    if (resultGame?._id !== crewGameId) {
      return;
    }

    setCrewRoomCode('');
    setCrewGameId(null);
    setCrewError('');
  }, [crewGameId, resultGame?._id]);

  useEffect(() => {
    if (!showMission || !missionSnapshot) {
      return undefined;
    }

    const handle = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(handle);
  }, [missionSnapshot, showMission]);

  useEffect(() => {
    if (
      !missionExitConfirmOpen ||
      !shouldCloseMissionExitDialog({
        liveMissionGameId: liveMissionGame?._id ?? null,
        resultGameId: resultGame?._id ?? null,
      })
    ) {
      return;
    }

    setMissionExitConfirmOpen(false);
  }, [liveMissionGame?._id, missionExitConfirmOpen, resultGame?._id]);

  useEffect(() => {
    if (!resultGame?._id) {
      return;
    }

    if (seenResultRef.current === resultGame._id) {
      return;
    }

    seenResultRef.current = resultGame._id;
    setMissionExitConfirmOpen(false);
    setMissionVisible(true);
    setResultSheetOpen(true);
  }, [resultGame]);

  useEffect(() => {
    const key = buildFeedbackKey(missionSnapshot);
    if (!key || feedbackKeyRef.current === key) {
      return;
    }

    feedbackKeyRef.current = key;
    const latestEvent = missionSnapshot.events.at(-1);

    if (missionSnapshot.status === 'won') {
      void signalActionResult('win');
      return;
    }

    if (latestEvent?.outcome === 'correct') {
      void signalActionResult('correct');
      return;
    }

    void signalActionResult('damage');
  }, [missionSnapshot]);

  useNativeBackButton(() => {
    const action = resolveNativeBackAction({
      hcpDialogOpen: Boolean(hcpUpdateVersion),
      crewSheetOpen,
      resultSheetOpen,
      missionExitConfirmOpen,
      hasActiveMission: showMission,
      view: showMission ? 'mission' : view,
    });

    switch (action) {
      case NATIVE_BACK_ACTIONS.DISMISS_HCP_DIALOG:
        setHcpUpdateVersion(null);
        return;
      case NATIVE_BACK_ACTIONS.DISMISS_CREW_SHEET:
        setCrewSheetOpen(false);
        setCrewError('');
        return;
      case NATIVE_BACK_ACTIONS.DISMISS_RESULT_SHEET:
        setResultSheetOpen(false);
        return;
      case NATIVE_BACK_ACTIONS.DISMISS_MISSION_CONFIRMATION:
        setMissionExitConfirmOpen(false);
        return;
      case NATIVE_BACK_ACTIONS.CONFIRM_ACTIVE_MISSION:
        setMissionExitConfirmOpen(true);
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
        const message = error.reason || error.message || 'Mission command failed.';
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

  const handleQuickMission = useCallback(() => {
    return invokeGameMethod(
      'quick',
      () =>
        Meteor.callAsync('games.startSolo', {
          ownerId: identity.ownerId,
          playerId: identity.playerId,
          testMode,
        }),
      {
        onSuccess: ({ gameId }) => {
          setMissionGameId(gameId);
          setMissionVisible(true);
          setResultSheetOpen(false);
          setView('play');
        },
      }
    );
  }, [identity.ownerId, identity.playerId, invokeGameMethod, testMode]);

  const handleCreateCrew = useCallback(() => {
    setCrewSheetMode('create');
    setCrewSheetOpen(true);
    setCrewError('');
    setStatusMessage('');
    setView('play');

    if (waitingCrewGame?._id) {
      setCrewRoomCode(waitingCrewGame.roomCode ?? '');
      setCrewGameId(waitingCrewGame._id);
      return Promise.resolve({
        gameId: waitingCrewGame._id,
        roomCode: waitingCrewGame.roomCode,
      });
    }

    if (crewGameId && crewRoomCode) {
      return Promise.resolve({
        gameId: crewGameId,
        roomCode: crewRoomCode,
      });
    }

    return invokeGameMethod(
      'crew',
      () =>
        Meteor.callAsync('games.createCrew', {
          ownerId: identity.ownerId,
          playerId: identity.playerId,
        }),
      {
        onSuccess: ({ gameId, roomCode }) => {
          setCrewRoomCode(roomCode);
          setCrewGameId(gameId);
          setMissionGameId(gameId);
          setMissionVisible(false);
          setResultSheetOpen(false);
        },
        onError: (message) => {
          setCrewError(message);
        },
      }
    );
  }, [
    crewGameId,
    crewRoomCode,
    identity.ownerId,
    identity.playerId,
    invokeGameMethod,
    waitingCrewGame?._id,
    waitingCrewGame?.roomCode,
  ]);

  const handleJoinCrew = useCallback(
    (roomCode) => {
      return invokeGameMethod(
        'join',
        () =>
          Meteor.callAsync('games.joinCrew', {
            ownerId: identity.ownerId,
            playerId: identity.playerId,
            roomCode,
          }),
        {
          onSuccess: ({ gameId }) => {
            setMissionGameId(gameId);
            setCrewGameId(gameId);
            setCrewError('');
            setMissionVisible(true);
            setResultSheetOpen(false);
          },
          onError: (message) => {
            setCrewError(message);
          },
        }
      );
    },
    [identity.ownerId, identity.playerId, invokeGameMethod]
  );

  const handleOpenJoinCrew = useCallback(() => {
    setCrewSheetMode('join');
    setCrewSheetOpen(true);
    setCrewError('');
    setStatusMessage('');
    setView('play');
  }, []);

  const handleCloseCrewSheet = useCallback(() => {
    setCrewSheetOpen(false);
    setCrewError('');
  }, []);

  const handleAction = useCallback(
    (action) => {
      if (!activeGame?._id) {
        return Promise.resolve(null);
      }

      return invokeGameMethod('answer', () =>
        Meteor.callAsync('games.answer', {
          ownerId: identity.ownerId,
          playerId: identity.playerId,
          gameId: activeGame._id,
          action,
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
          setMissionGameId(gameId);
          setMissionVisible(true);
          setResultSheetOpen(false);
        },
      }
    );
  }, [identity.ownerId, identity.playerId, invokeGameMethod, resultGame?._id, testMode]);

  const handleResultHome = useCallback(() => {
    setResultSheetOpen(false);
    setMissionGameId(null);
    setMissionVisible(false);
    setView('play');
  }, []);

  const handleResultClose = useCallback(() => {
    setResultSheetOpen(false);
  }, []);

  const handleResumeMission = useCallback(() => {
    setMissionExitConfirmOpen(false);
    setMissionVisible(true);
    setView('play');
  }, []);

  const handleLeaveMissionToPlay = useCallback(() => {
    setMissionExitConfirmOpen(false);
    setMissionVisible(false);
    setView('play');
  }, []);

  const handleCheckHcpUpdate = useCallback(async () => {
    setCheckingHcp(true);
    setHcpMessage('Checking for a newer app version...');

    try {
      const result = await checkForHcpUpdates();
      setHcpMessage(
        result.checked
          ? 'You will be prompted here when a new version is ready.'
          : 'Updates can be checked from mobile builds.'
      );
    } catch (error) {
      console.warn('HCP check failed', error);
      setHcpMessage('Unable to check for updates. Try again.');
    } finally {
      setCheckingHcp(false);
    }
  }, []);

  const handleInstallHcpUpdate = useCallback(async () => {
    setInstallingHcp(true);

    try {
      await applyHcpUpdate();
    } catch (error) {
      console.warn('HCP reload failed', error);
      setInstallingHcp(false);
      setHcpMessage('Install unavailable here.');
    }
  }, []);

  const handleToggleDdp = useCallback((enabled) => {
    setDdpEnabled(enabled);

    if (enabled) {
      Meteor.reconnect();
      return;
    }

    Meteor.disconnect();
  }, []);

  const handleReconnect = useCallback(() => {
    setDdpEnabled(true);
    Meteor.reconnect();
  }, []);

  const hcp = useMemo(
    () => ({
      checking: checkingHcp,
      installing: installingHcp,
      message: hcpMessage,
      updateVersion: hcpUpdateVersion,
      onCheck: handleCheckHcpUpdate,
      onPreview: () => {
        setHcpUpdateVersion(HCP_PREVIEW_VERSION);
        setHcpMessage('Previewing the update prompt.');
      },
      onInstall: handleInstallHcpUpdate,
      onDismiss: () => setHcpUpdateVersion(null),
    }),
    [checkingHcp, handleCheckHcpUpdate, handleInstallHcpUpdate, hcpMessage, hcpUpdateVersion, installingHcp]
  );

  const shellView = showMission ? 'mission' : view;

  return (
    <KonstaApp
      theme={pickTheme()}
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
            <h1>Preparing mission feed</h1>
            <p>Connecting ship systems.</p>
          </Block>
        ) : null}

        {showMission && missionSnapshot ? (
          <>
            <MissionStage
              game={missionSnapshot}
              now={now}
              busy={busyAction === 'answer'}
              connected={linkReady}
              onAction={handleAction}
            />
            {resultGame && !resultSheetOpen ? (
              <section className="mission-terminal-actions" aria-label="Terminal mission actions">
                <button
                  className="mission-terminal-actions__button mission-terminal-actions__button--primary"
                  type="button"
                  onClick={() => setResultSheetOpen(true)}
                >
                  <FileText aria-hidden="true" size={18} strokeWidth={2.3} />
                  <span>View report</span>
                </button>
                <button
                  className="mission-terminal-actions__button"
                  type="button"
                  onClick={handleResultHome}
                >
                  <HomeIcon aria-hidden="true" size={18} strokeWidth={2.3} />
                  <span>Home</span>
                </button>
              </section>
            ) : null}
            {resultGame ? (
              <ResultSheet
                game={resultGame}
                opened={resultSheetOpen}
                onRematch={handleRematch}
                rematching={busyAction === 'rematch'}
                onHome={handleResultHome}
                onClose={handleResultClose}
                onShare={() => shareResult(resultGame)}
              />
            ) : null}
          </>
        ) : null}

        {!showMission && view === 'play' ? (
          <>
            <PlayPage
              bestScore={bestScore}
              onQuickMission={handleQuickMission}
              onResumeMission={handleResumeMission}
              onCreateCrew={handleCreateCrew}
              onJoinCrew={handleOpenJoinCrew}
              createCrewLabel={hasWaitingCrewRoom ? 'Open Crew Room' : 'Create Crew Mission'}
              primaryActionLabel={hasBackgroundMission ? 'Resume Mission' : 'Quick Mission'}
              busyAction={busyAction}
              controlsDisabled={homeControlsDisabled}
              crewWaiting={hasWaitingCrewRoom}
              hasBackgroundMission={hasBackgroundMission}
              statusMessage={homeStatusMessage}
            />
            <CrewSheet
              mode={crewSheetMode}
              opened={crewSheetOpen}
              roomCode={crewRoomCode}
              busy={busyAction === 'crew' || busyAction === 'join'}
              disabled={homeControlsDisabled}
              error={crewError}
              onCreate={handleCreateCrew}
              onJoin={handleJoinCrew}
              onClose={handleCloseCrewSheet}
            />
          </>
        ) : null}

        {view === 'records' && !showMission ? (
          <RecordsPage
            games={recentGames}
            ready={recentReady}
            onPlay={hasBackgroundMission ? handleResumeMission : handleQuickMission}
            actionLabel={hasBackgroundMission ? 'Resume Mission' : 'Play'}
            disabled={hasBackgroundMission ? false : homeControlsDisabled}
          />
        ) : null}

        {view === 'system' && !showMission ? (
          <SystemInfoPage
            appInfo={appInfo}
            ddpEnabled={ddpEnabled}
            ddpEndpoint={getDdpEndpoint()}
            ddpStatus={connection.status}
            hcp={hcp}
            onReconnect={handleReconnect}
            onToggleDdp={handleToggleDdp}
          />
        ) : null}
      </AppShell>

      <MissionExitDialog
        opened={missionExitConfirmOpen}
        onStay={() => setMissionExitConfirmOpen(false)}
        onLeave={handleLeaveMissionToPlay}
      />
    </KonstaApp>
  );
}
