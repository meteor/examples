export function shouldCloseMissionExitDialog({ liveMissionGameId, resultGameId }) {
  return !liveMissionGameId || Boolean(resultGameId);
}
