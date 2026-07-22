import { Share } from '@capacitor/share';

export async function shareAudit({ title, text }) {
  const canShare = await Share.canShare().catch(() => ({ value: false }));
  if (canShare.value) {
    await Share.share({ title, text });
    return { shared: true, copied: false };
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { shared: false, copied: true };
    }
  } catch {
    return { shared: false, copied: false, reason: 'clipboard-failed' };
  }

  return { shared: false, copied: false, reason: 'unsupported' };
}
