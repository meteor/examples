import assert from 'assert';
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  chooseCpuColumn,
  createInitialState,
  dropMeteor,
  getAvailableColumns,
} from '../imports/api/games/engine';

function play(state, column, now = 1000) {
  const actorId = state.turn === 'player' ? state.playerId : state.rivalId;
  return dropMeteor(state, { actorId, column, now });
}

describe('game engine', function () {
  it('starts with an empty six-by-seven board and player turn', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });

    assert.strictEqual(game.board.length, BOARD_ROWS * BOARD_COLUMNS);
    assert.ok(game.board.every((cell) => cell === null));
    assert.strictEqual(game.turn, 'player');
    assert.strictEqual(game.status, 'playing');
    assert.strictEqual(game.winner, null);
    assert.strictEqual(game.moveCount, 0);
  });

  it('drops meteors to the lowest open row and alternates turns', function () {
    let game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });

    game = play(game, 3);
    assert.strictEqual(game.board[5 * BOARD_COLUMNS + 3], 'player');
    assert.strictEqual(game.turn, 'rival');

    game = play(game, 3, 1100);
    assert.strictEqual(game.board[4 * BOARD_COLUMNS + 3], 'rival');
    assert.strictEqual(game.turn, 'player');
    assert.strictEqual(game.moveCount, 2);
  });

  it('rejects columns outside the board, full columns, and wrong actors', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });

    assert.deepStrictEqual(
      dropMeteor(game, { actorId: 'intruder', column: 3, now: 1100 }),
      game
    );
    assert.deepStrictEqual(
      dropMeteor(game, { actorId: 'p1', column: -1, now: 1100 }),
      game
    );
    assert.deepStrictEqual(
      dropMeteor(game, { actorId: 'p1', column: BOARD_COLUMNS, now: 1100 }),
      game
    );

    const fullColumn = {
      ...game,
      board: game.board.map((cell, index) =>
        index % BOARD_COLUMNS === 0 ? 'player' : cell
      ),
    };
    assert.deepStrictEqual(
      dropMeteor(fullColumn, { actorId: 'p1', column: 0, now: 1100 }),
      fullColumn
    );
  });

  it('detects horizontal, vertical, and diagonal wins', function () {
    const winningBoards = [
      [
        null, null, null, null, null, null, null,
        null, null, null, null, null, null, null,
        null, null, null, null, null, null, null,
        null, null, null, null, null, null, null,
        null, null, null, null, null, null, null,
        'player', 'player', 'player', null, null, null, null,
      ],
      [
        null, null, null, null, null, null, null,
        null, null, null, null, null, null, null,
        null, null, null, 'player', null, null, null,
        null, null, null, 'player', null, null, null,
        null, null, null, 'player', null, null, null,
        null, null, null, null, null, null, null,
      ],
      [
        null, null, null, null, null, null, null,
        null, null, null, null, null, null, null,
        null, null, null, null, null, null, null,
        null, null, null, 'player', 'rival', null, null,
        null, null, 'player', 'rival', 'rival', null, null,
        null, 'player', 'rival', 'rival', 'rival', null, null,
      ],
    ];
    const columns = [3, 3, 4];

    for (let index = 0; index < winningBoards.length; index += 1) {
      const game = createInitialState({
        mode: 'solo',
        ownerId: 'owner',
        playerId: 'p1',
        now: 1000,
      });
      const won = dropMeteor(
        {
          ...game,
          board: winningBoards[index],
          moveCount: winningBoards[index].filter(Boolean).length,
        },
        { actorId: 'p1', column: columns[index], now: 1100 }
      );

      assert.strictEqual(won.status, 'won');
      assert.strictEqual(won.winner, 'player');
      assert.strictEqual(won.winningCells.length, 4);
    }
  });

  it('marks a full board without four connected as a draw', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const board = [
      'rival', 'player', 'rival', 'player', 'rival', 'player', null,
      'player', 'rival', 'player', 'rival', 'player', 'rival', 'player',
      'rival', 'player', 'rival', 'player', 'rival', 'player', 'rival',
      'player', 'rival', 'player', 'rival', 'player', 'rival', 'player',
      'rival', 'player', 'rival', 'player', 'rival', 'player', 'rival',
      'player', 'rival', 'player', 'rival', 'player', 'rival', 'player',
    ];
    const drawn = dropMeteor(
      { ...game, board, moveCount: 41 },
      { actorId: 'p1', column: 6, now: 1100 }
    );

    assert.strictEqual(drawn.status, 'draw');
    assert.strictEqual(drawn.winner, null);
    assert.deepStrictEqual(drawn.winningCells, []);
  });

  it('lists only columns that can accept another meteor', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const board = game.board.map((cell, index) =>
      index % BOARD_COLUMNS === 2 ? 'player' : cell
    );

    assert.deepStrictEqual(
      getAvailableColumns({ ...game, board }),
      [0, 1, 3, 4, 5, 6]
    );
  });

  it('lets CPU win, block player, then prefer center', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const cpuWin = {
      ...game,
      turn: 'rival',
      board: game.board.map((cell, index) =>
        [35, 36, 37].includes(index) ? 'rival' : cell
      ),
    };
    const playerThreat = {
      ...game,
      turn: 'rival',
      board: game.board.map((cell, index) =>
        [35, 36, 37].includes(index) ? 'player' : cell
      ),
    };

    assert.strictEqual(chooseCpuColumn(cpuWin), 3);
    assert.strictEqual(chooseCpuColumn(playerThreat), 3);
    assert.strictEqual(chooseCpuColumn({ ...game, turn: 'rival' }), 3);
  });

  it('provides a one-move showcase win only in test mode', function () {
    const normal = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const accelerated = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
      testMode: true,
    });

    assert.strictEqual(normal.moveCount, 0);
    assert.strictEqual(accelerated.moveCount, 6);
    assert.strictEqual(chooseCpuColumn({ ...accelerated, turn: 'rival' }), 3);

    const won = dropMeteor(accelerated, {
      actorId: 'p1',
      column: 3,
      now: 1100,
    });
    assert.strictEqual(won.status, 'won');
    assert.strictEqual(won.winner, 'player');
  });
});
