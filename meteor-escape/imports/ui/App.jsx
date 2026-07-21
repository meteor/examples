import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { FileText, Home as HomeIcon } from 'lucide-react';
import { App as KonstaApp, Block, List, ListItem } from 'konsta/react';
import { ACTIVE_STATUSES, TERMINAL_STATUSES, Games } from '../api/games/collection';
import { AppShell } from './components/AppShell';
import { CrewSheet } from './components/CrewSheet';
import { MissionStage } from './components/MissionStage';
import { ResultSheet } from './components/ResultSheet';
import { signalActionResult } from './native/haptics';
import { shareResult } from './native/share';
import { getClientIdentity } from './identity';
import { PlayPage } from './pages/PlayPage';
import { RecordsPage } from './pages/RecordsPage';

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

function SystemPanel({ connection, identity, activeGame, recentGames }) {
  return (
    <section className="system-page">
      <div className="system-page__header">
        <p className="eyebrow">Runtime snapshot</p>
        <h1>System</h1>
      </div>

      <List inset strong>
        <ListItem title="Theme" after={pickTheme()} />
        <ListItem title="Connection" after={connection.connected ? 'connected' : connection.status} />
        <ListItem title="DDP URL" after={Meteor.absoluteUrl()} />
        <ListItem title="Owner id" after={identity.ownerId.slice(0, 8)} />
        <ListItem title="Player id" after={identity.playerId.slice(0, 8)} />
        <ListItem title="Active mission" after={activeGame ? activeGame.status : 'none'} />
        <ListItem title="Completed missions" after={String(recentGames.length)} />
      </List>

      <Block strong className="system-page__note">
        Task 3 keeps diagnostics out of play flow while the native/system controls arrive in later
        tasks.
      </Block>
    </section>
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
  const [missionGameId, setMissionGameId] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [resultSheetOpen, setResultSheetOpen] = useState(false);
  const seenResultRef = useRef(null);
  const feedbackKeyRef = useRef(null);

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
  const showMission = Boolean(liveMissionGame) || Boolean(resultGame);

  const bestScore = recentGames.reduce(
    (highest, game) => Math.max(highest, Number(game.score) || 0),
    0
  );
  const homeStatusMessage =
    statusMessage ||
    (waitingCrewGame && !crewSheetOpen
      ? 'Crew room waiting in background. Reopen Create Crew Mission to share the code.'
      : '');

  useEffect(() => {
    if (!activeGame?._id) {
      return;
    }

    setMissionGameId(activeGame._id);
    setNow(Date.now());
  }, [activeGame?._id]);

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
    setView('play');
  }, [activeGame?._id, activeGame?.status, crewGameId, crewSheetOpen]);

  useEffect(() => {
    if (!showMission || !missionSnapshot) {
      return undefined;
    }

    const handle = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(handle);
  }, [missionSnapshot, showMission]);

  useEffect(() => {
    if (!resultGame?._id) {
      return;
    }

    if (seenResultRef.current === resultGame._id) {
      return;
    }

    seenResultRef.current = resultGame._id;
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

  useEffect(() => {
    if (!resultSheetOpen || !resultGame || !Capacitor.isPluginAvailable('App')) {
      return undefined;
    }

    let cancelled = false;
    let listener;

    void CapacitorApp.addListener('backButton', () => {
      if (!cancelled) {
        setResultSheetOpen(false);
      }
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, [resultGame, resultSheetOpen]);

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

    setCrewRoomCode('');
    setCrewGameId(null);

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
          setResultSheetOpen(false);
        },
        onError: (message) => {
          setCrewError(message);
        },
      }
    );
  }, [identity.ownerId, identity.playerId, invokeGameMethod, waitingCrewGame?._id, waitingCrewGame?.roomCode]);

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
          setResultSheetOpen(false);
        },
      }
    );
  }, [identity.ownerId, identity.playerId, invokeGameMethod, resultGame?._id, testMode]);

  const handleResultHome = useCallback(() => {
    setResultSheetOpen(false);
    setMissionGameId(null);
    setView('play');
  }, []);

  const handleResultClose = useCallback(() => {
    setResultSheetOpen(false);
  }, []);

  const shellView = showMission ? 'mission' : view;

  return (
    <KonstaApp
      theme={pickTheme()}
      dark={dark}
      safeAreas
      iosHoverHighlight
      materialTouchRipple
    >
      <AppShell view={shellView} onNavigate={setView} connection={connection}>
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
              connected={connection.connected}
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
              onCreateCrew={handleCreateCrew}
              onJoinCrew={handleOpenJoinCrew}
              busyAction={busyAction}
              crewWaiting={Boolean(waitingCrewGame)}
              statusMessage={homeStatusMessage}
            />
            <CrewSheet
              mode={crewSheetMode}
              opened={crewSheetOpen}
              roomCode={crewRoomCode}
              busy={busyAction === 'crew' || busyAction === 'join'}
              error={crewError}
              onCreate={handleCreateCrew}
              onJoin={handleJoinCrew}
              onClose={handleCloseCrewSheet}
            />
          </>
        ) : null}

        {view === 'records' && !activeGame ? (
          <RecordsPage games={recentGames} ready={recentReady} onPlay={handleQuickMission} />
        ) : null}

        {view === 'system' && !activeGame ? (
          <SystemPanel
            connection={connection}
            identity={identity}
            activeGame={activeGame}
            recentGames={recentGames}
          />
        ) : null}
      </AppShell>
    </KonstaApp>
  );
}
