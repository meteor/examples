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
    assert.strictEqual(shouldRevealActiveGame('waiting'), false);
    assert.strictEqual(shouldRevealActiveGame('playing'), true);
    assert.strictEqual(shouldRevealActiveGame(undefined), false);
  });
});
