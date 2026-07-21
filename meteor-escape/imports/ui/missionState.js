export function shouldCloseMissionExitDialog({ liveMissionGameId, resultGameId }) {
  return !liveMissionGameId || Boolean(resultGameId);
}

export function shouldRevealActiveGame(status) {
  return status === 'playing';
}
