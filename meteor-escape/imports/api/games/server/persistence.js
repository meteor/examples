import { Games } from '../collection';
import { parseGameDocument } from '../schema';

export async function persistGameTransition(game, nextState, now) {
  const stored = parseGameDocument({
    ...nextState,
    updatedAt: new Date(now),
  });
  const updatedCount = await Games.updateAsync(
    {
      _id: game._id,
      status: game.status,
      turn: game.turn,
      endsAt: game.endsAt,
      turnEndsAt: game.turnEndsAt,
    },
    { $set: stored }
  );

  return {
    applied: updatedCount === 1,
    game: await Games.findOneAsync(game._id),
  };
}
