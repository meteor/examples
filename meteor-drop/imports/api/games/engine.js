export const BOARD_ROWS = 6;
export const BOARD_COLUMNS = 7;

const BOARD_SIZE = BOARD_ROWS * BOARD_COLUMNS;
const CONNECT_LENGTH = 4;
const CPU_COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6];
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function getExpectedActorId(state) {
  return state.turn === 'player' ? state.playerId : state.rivalId;
}

function getCellIndex(row, column) {
  return row * BOARD_COLUMNS + column;
}

function getDropRow(board, column) {
  for (let row = BOARD_ROWS - 1; row >= 0; row -= 1) {
    if (board[getCellIndex(row, column)] === null) {
      return row;
    }
  }

  return -1;
}

function isInsideBoard(row, column) {
  return (
    row >= 0 &&
    row < BOARD_ROWS &&
    column >= 0 &&
    column < BOARD_COLUMNS
  );
}

function getWinningCells(board, row, column, marker) {
  for (const [rowStep, columnStep] of DIRECTIONS) {
    const connected = [getCellIndex(row, column)];

    for (const direction of [-1, 1]) {
      let nextRow = row + rowStep * direction;
      let nextColumn = column + columnStep * direction;

      while (
        isInsideBoard(nextRow, nextColumn) &&
        board[getCellIndex(nextRow, nextColumn)] === marker
      ) {
        connected.push(getCellIndex(nextRow, nextColumn));
        nextRow += rowStep * direction;
        nextColumn += columnStep * direction;
      }
    }

    if (connected.length >= CONNECT_LENGTH) {
      return connected
        .sort((left, right) => left - right)
        .slice(0, CONNECT_LENGTH);
    }
  }

  return [];
}

function previewDrop(state, column, marker) {
  const row = getDropRow(state.board, column);
  if (row === -1) {
    return null;
  }

  const board = [...state.board];
  const index = getCellIndex(row, column);
  board[index] = marker;

  return {
    board,
    row,
    index,
    winningCells: getWinningCells(board, row, column, marker),
  };
}

export function getAvailableColumns(state) {
  return CPU_COLUMN_ORDER.filter((column) => getDropRow(state.board, column) !== -1)
    .sort((left, right) => left - right);
}

export function chooseCpuColumn(state) {
  const availableColumns = CPU_COLUMN_ORDER.filter(
    (column) => getDropRow(state.board, column) !== -1
  );

  for (const column of availableColumns) {
    if (previewDrop(state, column, 'rival').winningCells.length > 0) {
      return column;
    }
  }

  for (const column of availableColumns) {
    if (previewDrop(state, column, 'player').winningCells.length > 0) {
      return column;
    }
  }

  return availableColumns[0] ?? null;
}

function createShowcaseBoard() {
  const board = Array(BOARD_SIZE).fill(null);
  board[getCellIndex(BOARD_ROWS - 1, 0)] = 'player';
  board[getCellIndex(BOARD_ROWS - 1, 1)] = 'player';
  board[getCellIndex(BOARD_ROWS - 1, 2)] = 'player';
  board[getCellIndex(BOARD_ROWS - 1, 4)] = 'rival';
  board[getCellIndex(BOARD_ROWS - 1, 5)] = 'rival';
  board[getCellIndex(BOARD_ROWS - 1, 6)] = 'rival';
  return board;
}

export function createInitialState({
  mode,
  ownerId,
  playerId,
  roomCode,
  testMode = false,
}) {
  return {
    mode,
    ownerId,
    playerId,
    rivalId: 'rival',
    roomCode: roomCode ?? null,
    status: 'playing',
    board: testMode ? createShowcaseBoard() : Array(BOARD_SIZE).fill(null),
    turn: 'player',
    winner: null,
    winningCells: [],
    moveCount: testMode ? 6 : 0,
    lastMove: null,
  };
}

export function dropMeteor(state, { actorId, column, now }) {
  if (
    state.status !== 'playing' ||
    actorId !== getExpectedActorId(state) ||
    !Number.isInteger(column) ||
    column < 0 ||
    column >= BOARD_COLUMNS
  ) {
    return state;
  }

  const dropped = previewDrop(state, column, state.turn);
  if (dropped === null) {
    return state;
  }

  const moveCount = state.moveCount + 1;
  const lastMove = {
    actorId,
    marker: state.turn,
    column,
    row: dropped.row,
    index: dropped.index,
    now,
  };

  if (dropped.winningCells.length > 0) {
    return {
      ...state,
      board: dropped.board,
      status: 'won',
      winner: state.turn,
      winningCells: dropped.winningCells,
      moveCount,
      lastMove,
    };
  }

  if (moveCount === BOARD_SIZE) {
    return {
      ...state,
      board: dropped.board,
      status: 'draw',
      winner: null,
      winningCells: [],
      moveCount,
      lastMove,
    };
  }

  return {
    ...state,
    board: dropped.board,
    turn: state.turn === 'player' ? 'rival' : 'player',
    moveCount,
    lastMove,
  };
}
