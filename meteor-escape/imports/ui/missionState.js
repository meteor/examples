export function shouldCloseMissionExitDialog({ liveMissionGameId, resultGameId }) {
  return !liveMissionGameId || Boolean(resultGameId);
}

export function shouldRevealActiveGame({ activeGameId, activeGameStatus, revealedGameId }) {
  return (
    activeGameStatus === 'playing' &&
    Boolean(activeGameId) &&
    activeGameId !== revealedGameId
  );
}
