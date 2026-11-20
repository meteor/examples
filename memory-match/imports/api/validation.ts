import { Meteor } from 'meteor/meteor';

export function validatePlayerName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Meteor.Error('invalid-player-name', 'Player name must be text');
  }
  const playerName = value.trim().replace(/\s+/g, ' ');
  if (playerName.length < 2 || playerName.length > 24) {
    throw new Meteor.Error(
      'invalid-player-name',
      'Player name must contain between 2 and 24 characters',
    );
  }
  return playerName;
}

export function validateGameId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Meteor.Error('invalid-game-id', 'Game id is required');
  }
  return value;
}

export function validateCardIndex(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) >= 16) {
    throw new Meteor.Error('invalid-card-index', 'Card index must be between 0 and 15');
  }
  return value as number;
}
