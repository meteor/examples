import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

function buildSummary(game, playerId) {
  const playerRole =
    game.players.find((player) => player.id === playerId)?.role ?? null;
  const result =
    game.status === 'draw'
      ? 'draw'
      : game.winner === playerRole
        ? 'win'
        : 'loss';
  return `Meteor Drop: ${result} in ${game.moveCount} moves. Connect four and claim the orbit.`;
}

function buildLiveMatchInvite(roomCode) {
  return `Join my Meteor Drop live match with room code ${roomCode}.`;
}

async function copyToClipboard(text) {
  if (typeof navigator?.clipboard?.writeText === 'function') {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === 'undefined') {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'readonly');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}

export async function shareResult(game, playerId) {
  const text = buildSummary(game, playerId);
  return shareText({
    title: 'Meteor Drop',
    text,
    dialogTitle: 'Share match result',
  });
}

async function shareText(payload) {
  if (Capacitor.isPluginAvailable('Share')) {
    try {
      if (typeof Share.canShare === 'function') {
        const capability = await Share.canShare();
        if (capability?.value === false) {
          throw new Error('share-unavailable');
        }
      }

      await Share.share(payload);

      return { shared: true, copied: false };
    } catch {
      const copied = await copyToClipboard(payload.text);
      return { shared: false, copied };
    }
  }

  const copied = await copyToClipboard(payload.text);
  return { shared: false, copied };
}

export async function shareLiveMatchRoom(roomCode) {
  return shareText({
    title: 'Meteor Drop Live Match',
    text: buildLiveMatchInvite(roomCode),
    dialogTitle: 'Share live match',
  });
}
