export function shouldCloseMatchExitDialog({ liveMatchId, resultMatchId }) {
  return !liveMatchId || Boolean(resultMatchId);
}

export function shouldRevealActiveMatch({
  activeGameId,
  activeGameStatus,
  revealedGameId,
}) {
  return (
    activeGameStatus === 'playing' &&
    Boolean(activeGameId) &&
    activeGameId !== revealedGameId
  );
}
