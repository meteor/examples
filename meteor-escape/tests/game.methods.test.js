import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Games } from '../imports/api/games/collection';
import '../imports/api/games/methods';
import { runCpuTurn } from '../imports/api/games/server/cpu';

if (Meteor.isServer) {
  describe('game methods', function () {
    beforeEach(async function () {
      await Games.removeAsync({});
    });

    it('starts a solo game with CPU copilot', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const result = await Meteor.callAsync('games.startSolo', { ownerId, playerId });
      const game = await Games.findOneAsync(result.gameId);

      assert.strictEqual(game.mode, 'solo');
      assert.strictEqual(game.status, 'playing');
      assert.strictEqual(game.players[1].type, 'cpu');
    });

    it('runs CPU through same transition', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', { ownerId, playerId });

      await Games.updateAsync(gameId, { $set: { turn: 'copilot', emergency: 'overheat' } });
      await runCpuTurn(gameId, Date.now());

      const game = await Games.findOneAsync(gameId);
      assert.strictEqual(game.events[0].action, 'cool');
      assert.strictEqual(game.turn, 'player');
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

    it('joins a crew game by room code', async function () {
      const ownerId = Random.id();
      const captainId = Random.id();
      const copilotId = Random.id();
      const { gameId } = await Meteor.callAsync('games.createCrew', {
        ownerId,
        playerId: captainId,
      });
      const created = await Games.findOneAsync(gameId);

      const joined = await Meteor.callAsync('games.joinCrew', {
        ownerId,
        playerId: copilotId,
        roomCode: created.roomCode,
      });
      const game = await Games.findOneAsync(joined.gameId);

      assert.strictEqual(game.status, 'playing');
      assert.strictEqual(game.players.length, 2);
      assert.strictEqual(game.players[1].id, copilotId);
      assert.strictEqual(game.players[1].type, 'human');
    });

    it('rejects duplicate crew joins', async function () {
      const ownerId = Random.id();
      const captainId = Random.id();
      const copilotId = Random.id();
      const { gameId } = await Meteor.callAsync('games.createCrew', {
        ownerId,
        playerId: captainId,
      });
      const created = await Games.findOneAsync(gameId);

      await Meteor.callAsync('games.joinCrew', {
        ownerId,
        playerId: copilotId,
        roomCode: created.roomCode,
      });

      await assert.rejects(
        () =>
          Meteor.callAsync('games.joinCrew', {
            ownerId,
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
          events: [
            {
              type: 'action',
              actorId: playerId,
              action: 'boost',
              now: Date.now(),
              emergency: 'path',
              outcome: 'correct',
            },
          ],
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
