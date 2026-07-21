import assert from 'assert';
import {
  createInitialState,
  resolveAction,
  resolveTimeout,
} from '../imports/api/games/engine';

describe('game engine', function () {
  it('charges warp for a correct response and alternates turn', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const next = resolveAction(
      { ...game, emergency: 'meteor', turn: 'player' },
      { actorId: 'p1', action: 'shield', now: 1500 }
    );
    assert.strictEqual(next.warp, 20);
    assert.strictEqual(next.turn, 'copilot');
    assert.strictEqual(next.streak, 1);
  });

  it('damages shield for a wrong response', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const next = resolveAction(
      { ...game, emergency: 'meteor', turn: 'player' },
      { actorId: 'p1', action: 'boost', now: 1500 }
    );
    assert.strictEqual(next.shield, 75);
    assert.strictEqual(next.streak, 0);
  });

  it('wins at full warp and loses when time expires', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const won = resolveAction(
      { ...game, emergency: 'path', turn: 'player', warp: 80 },
      { actorId: 'p1', action: 'boost', now: 1500 }
    );
    assert.strictEqual(won.status, 'won');
    const lost = resolveTimeout({ ...game, endsAt: 1200 }, { now: 1201 });
    assert.strictEqual(lost.status, 'lost');
  });
});
