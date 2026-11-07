import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ensureGamesIndexes, Games } from '../imports/api/games/collection';
import '../imports/api/games/methods';
import * as gameMethodsModule from '../imports/api/games/methods';
import * as turnScheduler from '../imports/api/games/server/cpu';

if (Meteor.isServer) {
  describe('game methods', function () {
    const originalE2EEnv = process.env.METEOR_DROP_E2E;

    beforeEach(async function () {
      process.env.METEOR_DROP_E2E = originalE2EEnv;
      turnScheduler.resetScheduledTurnsForTests?.();
      await ensureGamesIndexes();
      await Games.removeAsync({});
    });

    afterEach(function () {
      process.env.METEOR_DROP_E2E = originalE2EEnv;
      turnScheduler.resetScheduledTurnsForTests?.();
    });

    it('starts a solo board with CPU opponent', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const result = await Meteor.callAsync('games.startSolo', { ownerId, playerId });
      const game = await Games.findOneAsync(result.gameId);

      assert.strictEqual(game.mode, 'solo');
      assert.strictEqual(game.status, 'playing');
      assert.strictEqual(game.board.length, 42);
      assert.ok(game.board.every((cell) => cell === null));
      assert.strictEqual(game.players[1].type, 'cpu');
      assert.strictEqual(game.turn, 'player');
    });

    it('returns existing active solo board when start repeats', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const first = await Meteor.callAsync('games.startSolo', { ownerId, playerId });
      const second = await Meteor.callAsync('games.startSolo', { ownerId, playerId });

      assert.strictEqual(second.gameId, first.gameId);
      assert.strictEqual(
        await Games.find({ status: 'playing', participantIds: playerId }).countAsync(),
        1
      );
    });

    it('honors accelerated board only behind development E2E guard', async function () {
      assert.strictEqual(
        gameMethodsModule.shouldHonorTestMode?.(true, {
          isDevelopment: false,
          e2eEnv: '1',
        }),
        false
      );
      assert.strictEqual(
        gameMethodsModule.shouldHonorTestMode?.(true, {
          isDevelopment: true,
          e2eEnv: '1',
        }),
        true
      );

      process.env.METEOR_DROP_E2E = '1';
      const ownerId = Random.id();
      const playerId = Random.id();
      const result = await Meteor.callAsync('games.startSolo', {
        ownerId,
        playerId,
        testMode: true,
      });
      const game = await Games.findOneAsync(result.gameId);

      assert.strictEqual(game.moveCount, 6);
      assert.deepStrictEqual(game.board.slice(35), [
        'player',
        'player',
        'player',
        null,
        'rival',
        'rival',
        'rival',
      ]);
    });

    it('drops player meteor and runs CPU through same transition', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', {
        ownerId,
        playerId,
      });

      await Meteor.callAsync('games.dropMeteor', {
        ownerId,
        playerId,
        gameId,
        column: 2,
      });
      let game = await Games.findOneAsync(gameId);
      assert.strictEqual(game.board[37], 'player');
      assert.strictEqual(game.turn, 'rival');

      await turnScheduler.runCpuTurn(gameId, Date.now());
      game = await Games.findOneAsync(gameId);
      assert.strictEqual(game.board[38], 'rival');
      assert.strictEqual(game.turn, 'player');
      assert.strictEqual(game.moveCount, 2);
    });

    it('rejects invalid columns, full columns, and wrong owners', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', {
        ownerId,
        playerId,
      });

      await assert.rejects(
        Meteor.callAsync('games.dropMeteor', {
          ownerId,
          playerId,
          gameId,
          column: 7,
        }),
        /validation-error/
      );
      await assert.rejects(
        Meteor.callAsync('games.dropMeteor', {
          ownerId: Random.id(),
          playerId,
          gameId,
          column: 3,
        }),
        /not-found/
      );

      await Games.updateAsync(gameId, {
        $set: {
          board: Array.from({ length: 42 }, (cell, index) =>
            index % 7 === 0 ? 'player' : null
          ),
        },
      });
      await assert.rejects(
        Meteor.callAsync('games.dropMeteor', {
          ownerId,
          playerId,
          gameId,
          column: 0,
        }),
        /column-full/
      );
    });

    it('accepts only one move when two requests race on same turn', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', {
        ownerId,
        playerId,
      });

      const results = await Promise.allSettled([
        Meteor.callAsync('games.dropMeteor', {
          ownerId,
          playerId,
          gameId,
          column: 1,
        }),
        Meteor.callAsync('games.dropMeteor', {
          ownerId,
          playerId,
          gameId,
          column: 5,
        }),
      ]);
      const game = await Games.findOneAsync(gameId);

      assert.strictEqual(
        results.filter((result) => result.status === 'fulfilled').length,
        1
      );
      assert.strictEqual(game.moveCount, 1);
      assert.strictEqual(game.board.filter(Boolean).length, 1);
    });

    it('creates room and starts live human match after join', async function () {
      const hostOwnerId = Random.id();
      const hostPlayerId = Random.id();
      const guestOwnerId = Random.id();
      const guestPlayerId = Random.id();
      const created = await Meteor.callAsync('games.createLiveMatch', {
        ownerId: hostOwnerId,
        playerId: hostPlayerId,
      });
      let game = await Games.findOneAsync(created.gameId);

      assert.strictEqual(game.status, 'waiting');
      assert.strictEqual(game.roomCode.length, 6);

      await Meteor.callAsync('games.joinLiveMatch', {
        ownerId: guestOwnerId,
        playerId: guestPlayerId,
        roomCode: created.roomCode,
      });
      game = await Games.findOneAsync(created.gameId);
      assert.strictEqual(game.status, 'playing');
      assert.strictEqual(game.players[1].type, 'human');

      await Meteor.callAsync('games.dropMeteor', {
        ownerId: hostOwnerId,
        playerId: hostPlayerId,
        gameId: created.gameId,
        column: 3,
      });
      await Meteor.callAsync('games.dropMeteor', {
        ownerId: guestOwnerId,
        playerId: guestPlayerId,
        gameId: created.gameId,
        column: 4,
      });
      game = await Games.findOneAsync(created.gameId);

      assert.strictEqual(game.board[38], 'player');
      assert.strictEqual(game.board[39], 'rival');
      assert.strictEqual(game.turn, 'player');
    });

    it('creates fresh board after win or draw', async function () {
      const ownerId = Random.id();
      const playerId = Random.id();
      const { gameId } = await Meteor.callAsync('games.startSolo', {
        ownerId,
        playerId,
      });
      await Games.updateAsync(gameId, {
        $set: {
          status: 'draw',
          winner: null,
          moveCount: 42,
          board: Array.from({ length: 42 }, (cell, index) =>
            index % 2 === 0 ? 'player' : 'rival'
          ),
        },
      });

      const rematch = await Meteor.callAsync('games.rematch', {
        ownerId,
        playerId,
        gameId,
      });
      const nextGame = await Games.findOneAsync(rematch.gameId);

      assert.notStrictEqual(rematch.gameId, gameId);
      assert.strictEqual(nextGame.status, 'playing');
      assert.strictEqual(nextGame.moveCount, 0);
      assert.ok(nextGame.board.every((cell) => cell === null));
    });
  });
}
