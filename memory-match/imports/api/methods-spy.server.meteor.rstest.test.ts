import { Meteor } from 'meteor/meteor';
import { afterEach, describe, expect, rs, test } from '@rstest/core';

import { Games } from './games';
import './methods';

const playerName = `spy-${process.env.METEOR_TEST_WORKER_ID ?? 'single'}-Ada`;

describe.sequential('Rstest spies inside real Meteor runtime', () => {
  afterEach(async () => {
    await Games.removeAsync({ playerName });
  });

  test('spies without replacing Meteor or Mongo', async () => {
    const insert = rs.spyOn(Games, 'insertAsync');

    const gameId = await Meteor.callAsync('memory.start', {
      playerName,
      seed: 'rstest-runtime',
    }) as string;
    const persisted = await Games.findOneAsync(gameId);

    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      playerName,
      seed: 'rstest-runtime',
    }));
    expect(persisted?.playerName).toBe(playerName);
    expect(persisted?.seed).toBe('rstest-runtime');
  });
});
