import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Games } from '../imports/api/games/collection';
import '../imports/api/games/methods';
import * as gameMethodsModule from '../imports/api/games/methods';
import * as turnScheduler from '../imports/api/games/server/cpu';

if (Meteor.isServer) {
  describe('game methods', function () {
    const originalE2EEnv = process.env.METEOR_ESCAPE_E2E;

    beforeEach(async function () {
      process.env.METEOR_ESCAPE_E2E = originalE2EEnv;
      turnScheduler.resetScheduledTurnsForTests?.();
      await Games.removeAsync({});
    });

    afterEach(function () {
      process.env.METEOR_ESCAPE_E2E = originalE2EEnv;
      turnScheduler.resetScheduledTurnsForTests?.();
    });

    function buildTerminalEvent({ actorId, action = 'boost', emergency = 'path', outcome = 'correct' }) {
      return {
        type: 'action',
        actorId,
        action,
        now: Date.now(),
        emergency,
        outcome,
      };
    }

    it('starts a solo game with CPU copilot', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const result = await Meteor.callAsync('games.startSolo', { ownerId, playerId });
      const game = await Games.findOneAsync(result.gameId);

      assert.strictEqual(game.mode, 'solo');
      assert.strictEqual(game.status, 'playing');
      assert.strictEqual(game.players[1].type, 'cpu');
    });

    it('ignores payload testMode without E2E guard and in production-like mode', async function () {
      process.env.METEOR_ESCAPE_E2E = undefined;
      assert.strictEqual(
        gameMethodsModule.shouldHonorTestMode?.(true, { isDevelopment: false, e2eEnv: '1' }),
        false
      );

      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', {
        ownerId,
        playerId,
        testMode: true,
      });
      const game = await Games.findOneAsync(gameId);

      assert.strictEqual(game.warp, 0);
      assert.strictEqual(game.score, 0);
    });

    it('honors payload testMode only when E2E guard is enabled in development', async function () {
      process.env.METEOR_ESCAPE_E2E = '1';
      assert.strictEqual(
        gameMethodsModule.shouldHonorTestMode?.(true, { isDevelopment: true, e2eEnv: '1' }),
        true
      );

      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', {
        ownerId,
        playerId,
        testMode: true,
      });
      const game = await Games.findOneAsync(gameId);

      assert.strictEqual(game.warp, 60);
      assert.strictEqual(game.score, 60);
    });

    it('runs CPU through same transition', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', { ownerId, playerId });

      await Games.updateAsync(gameId, { $set: { turn: 'copilot', emergency: 'overheat' } });
      await turnScheduler.runCpuTurn(gameId, Date.now());

      const game = await Games.findOneAsync(gameId);
      assert.strictEqual(game.events[0].action, 'cool');
      assert.strictEqual(game.turn, 'player');
    });

    it('settles an expired player turn with shield damage and turn advance', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', { ownerId, playerId });
      const game = await Games.findOneAsync(gameId);

      await turnScheduler.runScheduledTurn?.(
        gameId,
        { expectedTurn: 'player', expectedTurnEndsAt: game.turnEndsAt },
        game.turnEndsAt + 1
      );

      const updated = await Games.findOneAsync(gameId);
      assert.strictEqual(updated.shield, 75);
      assert.strictEqual(updated.turn, 'copilot');
      assert.strictEqual(updated.events.at(-1).outcome, 'late');
    });

    it('settles expired player turns into terminal loss when shield reaches zero', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', { ownerId, playerId });
      const game = await Games.findOneAsync(gameId);

      await Games.updateAsync(gameId, { $set: { shield: 25 } });
      await turnScheduler.runScheduledTurn?.(
        gameId,
        { expectedTurn: 'player', expectedTurnEndsAt: game.turnEndsAt },
        game.turnEndsAt + 1
      );

      const updated = await Games.findOneAsync(gameId);
      assert.strictEqual(updated.status, 'lost');
      assert.strictEqual(updated.shield, 0);
    });

    it('rejects wrong-owner answers', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', { ownerId, playerId });

      await assert.rejects(
        () =>
          Meteor.callAsync('games.answer', {
            ownerId: Random.id(),
            playerId,
            gameId,
            action: 'shield',
          }),
        (err) => err.error === 'not-found'
      );
    });

    it('rejects stale answers', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', { ownerId, playerId });

      await Games.updateAsync(gameId, { $set: { turnEndsAt: Date.now() - 1 } });

      await assert.rejects(
        () =>
          Meteor.callAsync('games.answer', {
            ownerId,
            playerId,
            gameId,
            action: 'shield',
          }),
        (err) => err.error === 'stale-action'
      );
    });

    it('joins a crew game by room code across owners', async function () {
      const ownerId = Random.id();
      const joinedOwnerId = Random.id();
      const captainId = Random.id();
      const copilotId = Random.id();
      const { gameId } = await Meteor.callAsync('games.createCrew', {
        ownerId,
        playerId: captainId,
      });
      const created = await Games.findOneAsync(gameId);

      assert.match(created.roomCode, /^[A-HJ-NP-Z2-9]{6}$/);

      const joined = await Meteor.callAsync('games.joinCrew', {
        ownerId: joinedOwnerId,
        playerId: copilotId,
        roomCode: created.roomCode,
      });
      const game = await Games.findOneAsync(joined.gameId);

      assert.strictEqual(game.status, 'playing');
      assert.strictEqual(game.players.length, 2);
      assert.strictEqual(game.players[0].ownerId, ownerId);
      assert.strictEqual(game.players[1].id, copilotId);
      assert.strictEqual(game.players[1].ownerId, joinedOwnerId);
      assert.strictEqual(game.players[1].type, 'human');
      assert.deepStrictEqual(game.ownerIds, [ownerId, joinedOwnerId]);
    });

    it('rejects duplicate captain join while waiting', async function () {
      const ownerId = Random.id();
      const captainId = Random.id();
      const { gameId } = await Meteor.callAsync('games.createCrew', {
        ownerId,
        playerId: captainId,
      });
      const created = await Games.findOneAsync(gameId);

      await assert.rejects(
        () =>
          Meteor.callAsync('games.joinCrew', {
            ownerId,
            playerId: captainId,
            roomCode: created.roomCode,
          }),
        (err) => err.error === 'duplicate-join'
      );
    });

    it('allows joined copilot to answer with own owner id', async function () {
      const ownerId = Random.id();
      const joinedOwnerId = Random.id();
      const captainId = Random.id();
      const copilotId = Random.id();
      const { gameId } = await Meteor.callAsync('games.createCrew', {
        ownerId,
        playerId: captainId,
      });
      const created = await Games.findOneAsync(gameId);

      await Meteor.callAsync('games.joinCrew', {
        ownerId: joinedOwnerId,
        playerId: copilotId,
        roomCode: created.roomCode,
      });
      await Games.updateAsync(gameId, {
        $set: {
          turn: 'copilot',
          emergency: 'overheat',
          turnEndsAt: Date.now() + 10_000,
        },
      });

      await Meteor.callAsync('games.answer', {
        ownerId: joinedOwnerId,
        playerId: copilotId,
        gameId,
        action: 'cool',
      });

      const game = await Games.findOneAsync(gameId);
      assert.strictEqual(game.events.at(-1).actorId, copilotId);
      assert.strictEqual(game.events.at(-1).action, 'cool');
      assert.strictEqual(game.turn, 'player');
    });

    it('allows crew rematch from joined owner', async function () {
      const ownerId = Random.id();
      const joinedOwnerId = Random.id();
      const captainId = Random.id();
      const copilotId = Random.id();
      const { gameId } = await Meteor.callAsync('games.createCrew', {
        ownerId,
        playerId: captainId,
      });
      const created = await Games.findOneAsync(gameId);

      await Meteor.callAsync('games.joinCrew', {
        ownerId: joinedOwnerId,
        playerId: copilotId,
        roomCode: created.roomCode,
      });
      await Games.updateAsync(gameId, {
        $set: {
          status: 'lost',
          shield: 0,
          warp: 80,
          score: 80,
          streak: 0,
          bestStreak: 3,
          events: [buildTerminalEvent({ actorId: captainId, action: 'shield', emergency: 'meteor', outcome: 'wrong' })],
        },
      });

      const result = await Meteor.callAsync('games.rematch', {
        ownerId: joinedOwnerId,
        playerId: copilotId,
        gameId,
      });
      const game = await Games.findOneAsync(result.gameId);

      assert.notStrictEqual(result.gameId, gameId);
      assert.strictEqual(game.mode, 'crew');
      assert.strictEqual(game.ownerId, ownerId);
      assert.deepStrictEqual(game.ownerIds, [ownerId, joinedOwnerId]);
      assert.strictEqual(game.players[1].ownerId, joinedOwnerId);
      assert.strictEqual(game.status, 'playing');
      assert.deepStrictEqual(game.events, []);
    });

    it('rejects full crew joins after another owner joins', async function () {
      const ownerId = Random.id();
      const joinedOwnerId = Random.id();
      const captainId = Random.id();
      const copilotId = Random.id();
      const { gameId } = await Meteor.callAsync('games.createCrew', {
        ownerId,
        playerId: captainId,
      });
      const created = await Games.findOneAsync(gameId);

      await Meteor.callAsync('games.joinCrew', {
        ownerId: joinedOwnerId,
        playerId: copilotId,
        roomCode: created.roomCode,
      });

      await assert.rejects(
        () =>
          Meteor.callAsync('games.joinCrew', {
            ownerId: Random.id(),
            playerId: Random.id(),
            roomCode: created.roomCode,
          }),
        (err) => err.error === 'not-found'
      );
    });

    it('resets solo games with rematch', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', { ownerId, playerId });

      await Games.updateAsync(gameId, {
        $set: {
          status: 'won',
          shield: 25,
          warp: 100,
          score: 100,
          streak: 5,
          bestStreak: 5,
          events: [buildTerminalEvent({ actorId: playerId })],
        },
      });

      const result = await Meteor.callAsync('games.rematch', { ownerId, playerId, gameId });
      const game = await Games.findOneAsync(result.gameId);

      assert.notStrictEqual(result.gameId, gameId);
      assert.strictEqual(game.status, 'playing');
      assert.strictEqual(game.shield, 100);
      assert.strictEqual(game.warp, 0);
      assert.deepStrictEqual(game.events, []);
    });
  });
}
