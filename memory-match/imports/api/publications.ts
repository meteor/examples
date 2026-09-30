import { Meteor } from 'meteor/meteor';

import { Games, type GameDocument } from './games';
import { validateGameId } from './validation';

export async function leaderboardDocuments({
  playerPrefix,
}: {
  playerPrefix?: string;
} = {}): Promise<GameDocument[]> {
  return Games.find(
    {
      'state.status': 'completed',
      score: { $exists: true },
      ...(playerPrefix ? { playerName: { $regex: `^${playerPrefix}` } } : {}),
    },
    {
      sort: { score: -1, 'state.moves': 1, 'state.completedAt': 1, playerName: 1 },
      limit: 10,
      fields: { seed: 0 },
    },
  ).fetchAsync();
}

Meteor.publish('memory.game', function publishGame(gameId: unknown) {
  return Games.find({ _id: validateGameId(gameId) }, { fields: { seed: 0 } });
});

Meteor.publish('memory.leaderboard', function publishLeaderboard() {
  return Games.find(
    { 'state.status': 'completed', score: { $exists: true } },
    {
      sort: { score: -1, 'state.moves': 1, 'state.completedAt': 1, playerName: 1 },
      limit: 10,
      fields: { seed: 0 },
    },
  );
});
