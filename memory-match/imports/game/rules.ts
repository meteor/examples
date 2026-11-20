import type { CardDefinition, CardState, GameState } from './types';

export type GameRuleErrorCode =
  | 'already-completed'
  | 'already-matched'
  | 'already-revealed'
  | 'invalid-index'
  | 'mismatch-pending'
  | 'no-mismatch';

export class GameRuleError extends Error {
  constructor(
    readonly code: GameRuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameRuleError';
  }
}

export function createInitialState(
  deck: readonly CardDefinition[],
  startedAt = Date.now(),
): GameState {
  return {
    cards: deck.map((card): CardState => ({
      ...card,
      isRevealed: false,
      isMatched: false,
    })),
    firstSelection: null,
    secondSelection: null,
    moves: 0,
    status: 'playing',
    startedAt,
    completedAt: null,
  };
}

function reveal(cards: readonly CardState[], index: number): readonly CardState[] {
  return cards.map((card, cardIndex) => cardIndex === index
    ? { ...card, isRevealed: true }
    : card);
}

export function flipCard(state: GameState, index: number, now = Date.now()): GameState {
  if (!Number.isSafeInteger(index) || index < 0 || index >= state.cards.length) {
    throw new GameRuleError('invalid-index', `Card index ${index} is outside this board`);
  }
  if (state.status === 'completed') {
    throw new GameRuleError('already-completed', 'Game is already complete');
  }
  if (state.status === 'resolving') {
    throw new GameRuleError('mismatch-pending', 'Must resolve mismatch before another flip');
  }
  const selected = state.cards[index];
  if (selected.isMatched) {
    throw new GameRuleError('already-matched', 'Card is already matched');
  }
  if (selected.isRevealed) {
    throw new GameRuleError('already-revealed', 'Card is already revealed');
  }

  const revealed = reveal(state.cards, index);
  if (state.firstSelection === null) {
    return { ...state, cards: revealed, firstSelection: index };
  }

  const firstIndex = state.firstSelection;
  const matched = state.cards[firstIndex].symbol === selected.symbol;
  if (!matched) {
    return {
      ...state,
      cards: revealed,
      secondSelection: index,
      moves: state.moves + 1,
      status: 'resolving',
    };
  }

  const cards = revealed.map((card, cardIndex) =>
    cardIndex === firstIndex || cardIndex === index
      ? { ...card, isMatched: true, isRevealed: true }
      : card);
  const completed = cards.every((card) => card.isMatched);
  return {
    ...state,
    cards,
    firstSelection: null,
    secondSelection: null,
    moves: state.moves + 1,
    status: completed ? 'completed' : 'playing',
    completedAt: completed ? now : null,
  };
}

export function hideUnmatched(state: GameState): GameState {
  if (state.status !== 'resolving' || state.firstSelection === null || state.secondSelection === null) {
    throw new GameRuleError('no-mismatch', 'No mismatch is waiting to be hidden');
  }
  const selections = new Set([state.firstSelection, state.secondSelection]);
  return {
    ...state,
    cards: state.cards.map((card, index) => selections.has(index)
      ? { ...card, isRevealed: false }
      : card),
    firstSelection: null,
    secondSelection: null,
    status: 'playing',
  };
}
