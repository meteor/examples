import assert from 'assert';
import {
  createInitialState,
  getRequiredAction,
  resolveAction,
  resolveTimeout,
} from '../imports/api/games/engine';

function getActorId(state) {
  return state.turn === 'player' ? state.playerId : state.copilotId;
}

function getWrongAction(emergency) {
  const requiredAction = getRequiredAction(emergency);

  if (requiredAction !== 'shield') {
    return 'shield';
  }

  return 'boost';
}

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

  it('rejects action from wrong actor', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const next = resolveAction(game, {
      actorId: 'intruder',
      action: 'shield',
      now: 1500,
    });

    assert.deepStrictEqual(next, game);
  });

  it('rejects action after turn deadline', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const next = resolveAction(game, {
      actorId: 'p1',
      action: 'shield',
      now: game.turnEndsAt + 1,
    });

    assert.deepStrictEqual(next, game);
  });

  it('damages shield for a late turn timeout', function () {
    const game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });
    const next = resolveTimeout(game, { now: game.turnEndsAt + 1 });

    assert.strictEqual(next.shield, 75);
    assert.strictEqual(next.streak, 0);
    assert.strictEqual(next.turn, 'copilot');
    assert.strictEqual(next.events.at(-1).outcome, 'late');
  });

  it('cycles emergencies in deterministic order', function () {
    let game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });

    game = resolveAction(game, {
      actorId: getActorId(game),
      action: getRequiredAction(game.emergency),
      now: 1500,
    });
    assert.strictEqual(game.emergency, 'overheat');

    game = resolveAction(game, {
      actorId: getActorId(game),
      action: getRequiredAction(game.emergency),
      now: 2000,
    });
    assert.strictEqual(game.emergency, 'path');

    game = resolveAction(game, {
      actorId: getActorId(game),
      action: getRequiredAction(game.emergency),
      now: 2500,
    });
    assert.strictEqual(game.emergency, 'meteor');
  });

  it('caps events history at five entries', function () {
    let game = createInitialState({
      mode: 'solo',
      ownerId: 'owner',
      playerId: 'p1',
      now: 1000,
    });

    for (let index = 0; index < 6; index += 1) {
      game = resolveAction(game, {
        actorId: getActorId(game),
        action:
          index % 2 === 0
            ? getRequiredAction(game.emergency)
            : getWrongAction(game.emergency),
        now: 1500 + index * 500,
      });
    }

    assert.strictEqual(game.events.length, 5);
    assert.deepStrictEqual(
      game.events.map((event) => event.now),
      [2000, 2500, 3000, 3500, 4000]
    );
  });
});
