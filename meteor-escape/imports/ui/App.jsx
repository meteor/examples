import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Capacitor } from '@capacitor/core';
import { App as KonstaApp, Block, List, ListItem } from 'konsta/react';
import { ACTIVE_STATUSES, TERMINAL_STATUSES, Games } from '../api/games/collection';
import { AppShell } from './components/AppShell';
import { getClientIdentity } from './identity';
import { PlayPage } from './pages/PlayPage';
import { RecordsPage } from './pages/RecordsPage';

function pickTheme() {
  return Capacitor.getPlatform() === 'ios' ? 'ios' : 'material';
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
  const [view, setView] = useState('play');
  const [busyAction, setBusyAction] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [dark, setDark] = useState(false);

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
        { status: { $in: ACTIVE_STATUSES } },
        { sort: { updatedAt: -1 } }
      ),
      recentGames: Games.find(
        { status: { $in: TERMINAL_STATUSES } },
        { sort: { updatedAt: -1 } }
      ).fetch(),
    };
  }, [identity.ownerId, identity.playerId]);

  const bestScore = recentGames.reduce(
    (highest, game) => Math.max(highest, Number(game.score) || 0),
    0
  );

  const invokeGameMethod = useCallback(
    async (actionName, callback) => {
      setBusyAction(actionName);
      setStatusMessage('');

      try {
        await callback();
        setView('play');
      } catch (error) {
        setStatusMessage(error.reason || error.message || 'Mission command failed.');
      } finally {
        setBusyAction(null);
      }
    },
    []
  );

  const handleQuickMission = useCallback(() => {
    return invokeGameMethod('quick', () =>
      Meteor.callAsync('games.startSolo', {
        ownerId: identity.ownerId,
        playerId: identity.playerId,
      })
    );
  }, [identity.ownerId, identity.playerId, invokeGameMethod]);

  const handleCreateCrew = useCallback(() => {
    return invokeGameMethod('crew', async () => {
      const result = await Meteor.callAsync('games.createCrew', {
        ownerId: identity.ownerId,
        playerId: identity.playerId,
      });
      setStatusMessage(`Crew room ${result.roomCode} ready for a copilot.`);
    });
  }, [identity.ownerId, identity.playerId, invokeGameMethod]);

  const handleJoinCrew = useCallback(
    (roomCode) => {
      const normalizedRoomCode = roomCode.trim().toUpperCase();

      if (normalizedRoomCode.length !== 6) {
        setStatusMessage('Enter a six-character room code.');
        return Promise.resolve();
      }

      return invokeGameMethod('join', () =>
        Meteor.callAsync('games.joinCrew', {
          ownerId: identity.ownerId,
          playerId: identity.playerId,
          roomCode: normalizedRoomCode,
        })
      );
    },
    [identity.ownerId, identity.playerId, invokeGameMethod]
  );

  const shellView = activeGame ? 'mission' : view;

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

        {shellView === 'mission' || view === 'play' ? (
          <PlayPage
            bestScore={bestScore}
            activeGame={activeGame}
            onQuickMission={handleQuickMission}
            onCreateCrew={handleCreateCrew}
            onJoinCrew={handleJoinCrew}
            busyAction={busyAction}
            statusMessage={statusMessage}
          />
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
