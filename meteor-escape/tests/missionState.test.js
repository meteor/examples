import assert from 'assert';
import {
  shouldCloseMissionExitDialog,
  shouldRevealActiveGame,
} from '../imports/ui/missionState';

describe('mission state helpers', function () {
  it('closes mission exit dialog when a result sheet is about to take over', function () {
    assert.strictEqual(
      shouldCloseMissionExitDialog({
        liveMissionGameId: 'live-game',
        resultGameId: 'result-game',
      }),
      true
    );
  });

  it('closes mission exit dialog when the live mission is gone', function () {
    assert.strictEqual(
      shouldCloseMissionExitDialog({
        liveMissionGameId: null,
        resultGameId: null,
      }),
      true
    );
  });

  it('keeps mission exit dialog available while live mission stays active without result', function () {
    assert.strictEqual(
      shouldCloseMissionExitDialog({
        liveMissionGameId: 'live-game',
        resultGameId: null,
      }),
      false
    );
  });

  it('reveals a subscribed game only after a waiting crew room starts playing', function () {
    assert.strictEqual(
      shouldRevealActiveGame({
        activeGameId: 'mission-1',
        activeGameStatus: 'waiting',
        revealedGameId: null,
      }),
      false
    );
    assert.strictEqual(
      shouldRevealActiveGame({
        activeGameId: 'mission-1',
        activeGameStatus: 'playing',
        revealedGameId: null,
      }),
      true
    );
  });

  it('does not resurface a background mission after subscription churn', function () {
    assert.strictEqual(
      shouldRevealActiveGame({
        activeGameId: 'mission-1',
        activeGameStatus: 'playing',
        revealedGameId: 'mission-1',
      }),
      false
    );
    assert.strictEqual(
      shouldRevealActiveGame({
        activeGameId: undefined,
        activeGameStatus: undefined,
        revealedGameId: 'mission-1',
      }),
      false
    );
  });
});
