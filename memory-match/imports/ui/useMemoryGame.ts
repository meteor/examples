import { Meteor } from 'meteor/meteor';
import { useSubscribe, useTracker } from 'meteor/react-meteor-data';
import { useCallback, useState } from 'react';

import { Games } from '../api/games';

export function useMemoryGame(gameId: string) {
  const isLoading = useSubscribe('memory.game', gameId)();
  const game = useTracker(() => Games.findOne(gameId), [gameId]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [error, setError] = useState('');

  const flip = useCallback(async (cardIndex: number) => {
    if (isFlipping) return;
    setIsFlipping(true);
    setError('');
    try {
      await Meteor.callAsync('memory.flip', { gameId, cardIndex });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsFlipping(false);
    }
  }, [gameId, isFlipping]);

  return { error, flip, game, isFlipping, isLoading };
}
