import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

function buildSummary(game) {
  const result = game.status === 'won' ? 'escaped' : 'lost the hull';
  return `Meteor Escape: ${result} with score ${game.score}, warp ${game.warp}%, shield ${game.shield}%, best streak ${game.bestStreak}.`;
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

export async function shareResult(game) {
  const text = buildSummary(game);

  if (Capacitor.isPluginAvailable('Share')) {
    try {
      if (typeof Share.canShare === 'function') {
        const capability = await Share.canShare();
        if (capability?.value === false) {
          throw new Error('share-unavailable');
        }
      }

      await Share.share({
        title: 'Meteor Escape',
        text,
        dialogTitle: 'Share mission result',
      });

      return { shared: true, copied: false };
    } catch {
      const copied = await copyToClipboard(text);
      return { shared: false, copied };
    }
  }

  const copied = await copyToClipboard(text);
  return { shared: false, copied };
}
