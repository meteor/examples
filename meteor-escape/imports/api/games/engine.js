export const EMERGENCIES = ['meteor', 'overheat', 'path'];

const REQUIRED_ACTIONS = {
  meteor: 'shield',
  overheat: 'cool',
  path: 'boost',
};

const MISSION_DURATION_MS = 60_000;
const TURN_DURATION_MS = 4_000;
const WARP_REWARD = 20;
const SHIELD_DAMAGE = 25;
const MAX_EVENTS = 5;
const TERMINAL_STATUSES = new Set(['won', 'lost']);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getExpectedActorId(state) {
  return state.turn === 'player' ? state.playerId : state.copilotId;
}

function getNextEmergency(emergency) {
  const emergencyIndex = EMERGENCIES.indexOf(emergency);
  const nextIndex = emergencyIndex === -1 ? 0 : (emergencyIndex + 1) % EMERGENCIES.length;
  return EMERGENCIES[nextIndex];
}

function getNextTurn(turn) {
  return turn === 'player' ? 'copilot' : 'player';
}

function appendEvent(state, event) {
  const events = [...state.events, event];
  return events.slice(-MAX_EVENTS);
}

function finishState(state, event) {
  return {
    ...state,
    events: appendEvent(state, event),
  };
}

function advanceState(state, now, updates, event) {
  const nextTurn = getNextTurn(state.turn);
  const nextEmergency = getNextEmergency(state.emergency);

  return finishState(
    {
      ...state,
      ...updates,
      emergency: nextEmergency,
      turn: nextTurn,
      turnEndsAt: now + TURN_DURATION_MS,
    },
    event
  );
}

function markLost(state, event) {
  return finishState(
    {
      ...state,
      status: 'lost',
      shield: clamp(state.shield, 0, 100),
    },
    event
  );
}

function markWon(state, event) {
  return finishState(
    {
      ...state,
      status: 'won',
      warp: clamp(state.warp, 0, 100),
    },
    event
  );
}

function isTerminal(state) {
  return TERMINAL_STATUSES.has(state.status);
}

export function getRequiredAction(emergency) {
  return REQUIRED_ACTIONS[emergency];
}

export function createInitialState({ mode, ownerId, playerId, now, roomCode, testMode = false }) {
  return {
    mode,
    ownerId,
    playerId,
    copilotId: 'copilot',
    roomCode: roomCode ?? null,
    status: 'playing',
    emergency: EMERGENCIES[0],
    turn: 'player',
    shield: 100,
    warp: testMode ? 60 : 0,
    score: testMode ? 60 : 0,
    streak: 0,
    bestStreak: testMode ? 3 : 0,
    endsAt: now + MISSION_DURATION_MS,
    turnEndsAt: now + TURN_DURATION_MS,
    events: [],
  };
}

export function resolveAction(state, { actorId, action, now }) {
  if (isTerminal(state) || actorId !== getExpectedActorId(state) || now > state.turnEndsAt) {
    return state;
  }

  if (now > state.endsAt) {
    return markLost(state, {
      type: 'timeout',
      now,
      emergency: state.emergency,
      outcome: 'mission-expired',
    });
  }

  const correct = getRequiredAction(state.emergency) === action;

  if (correct) {
    const streak = state.streak + 1;
    const warp = clamp(state.warp + WARP_REWARD, 0, 100);
    const nextState = {
      ...state,
      warp,
      score: state.score + WARP_REWARD,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
    };

    if (warp >= 100) {
      return markWon(nextState, {
        type: 'action',
        actorId,
        action,
        now,
        emergency: state.emergency,
        outcome: 'correct',
      });
    }

    return advanceState(
      nextState,
      now,
      {},
      {
        type: 'action',
        actorId,
        action,
        now,
        emergency: state.emergency,
        outcome: 'correct',
      }
    );
  }

  const nextState = {
    ...state,
    shield: clamp(state.shield - SHIELD_DAMAGE, 0, 100),
    streak: 0,
  };

  if (nextState.shield <= 0) {
    return markLost(nextState, {
      type: 'action',
      actorId,
      action,
      now,
      emergency: state.emergency,
      outcome: 'wrong',
    });
  }

  return advanceState(
    nextState,
    now,
    {},
    {
      type: 'action',
      actorId,
      action,
      now,
      emergency: state.emergency,
      outcome: 'wrong',
    }
  );
}

export function resolveTimeout(state, { now }) {
  if (isTerminal(state)) {
    return state;
  }

  if (now > state.endsAt) {
    return markLost(state, {
      type: 'timeout',
      now,
      emergency: state.emergency,
      outcome: 'mission-expired',
    });
  }

  if (now <= state.turnEndsAt) {
    return state;
  }

  const nextState = {
    ...state,
    shield: clamp(state.shield - SHIELD_DAMAGE, 0, 100),
    streak: 0,
  };

  if (nextState.shield <= 0) {
    return markLost(nextState, {
      type: 'timeout',
      now,
      emergency: state.emergency,
      outcome: 'late',
    });
  }

  return advanceState(
    nextState,
    now,
    {},
    {
      type: 'timeout',
      now,
      emergency: state.emergency,
      outcome: 'late',
    }
  );
}
