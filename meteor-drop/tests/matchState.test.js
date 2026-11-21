import assert from 'assert';
import {
  shouldCloseMatchExitDialog,
  shouldRevealActiveMatch,
} from '../imports/ui/matchState';

describe('match state helpers', function () {
  it('closes the exit dialog when a result sheet is about to take over', function () {
    assert.strictEqual(
      shouldCloseMatchExitDialog({
        liveMatchId: 'live-match',
        resultMatchId: 'result-match',
      }),
      true
    );
  });

  it('closes the exit dialog when the live match is gone', function () {
    assert.strictEqual(
      shouldCloseMatchExitDialog({
        liveMatchId: null,
        resultMatchId: null,
      }),
      true
    );
  });

  it('keeps the exit dialog available while a live match remains active', function () {
    assert.strictEqual(
      shouldCloseMatchExitDialog({
        liveMatchId: 'live-match',
        resultMatchId: null,
      }),
      false
    );
  });

  it('reveals a live room only after both players are ready', function () {
    assert.strictEqual(
      shouldRevealActiveMatch({
        activeGameId: 'match-1',
        activeGameStatus: 'waiting',
        revealedGameId: null,
      }),
      false
    );
    assert.strictEqual(
      shouldRevealActiveMatch({
        activeGameId: 'match-1',
        activeGameStatus: 'playing',
        revealedGameId: null,
      }),
      true
    );
  });

  it('does not resurface a background match after subscription churn', function () {
    assert.strictEqual(
      shouldRevealActiveMatch({
        activeGameId: 'match-1',
        activeGameStatus: 'playing',
        revealedGameId: 'match-1',
      }),
      false
    );
    assert.strictEqual(
      shouldRevealActiveMatch({
        activeGameId: undefined,
        activeGameStatus: undefined,
        revealedGameId: 'match-1',
      }),
      false
    );
  });
});
