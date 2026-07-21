import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function signalActionResult(kind) {
  if (!Capacitor.isPluginAvailable('Haptics')) {
    return false;
  }

  try {
    if (kind === 'win') {
      await Haptics.notification({ type: NotificationType.Success });
      return true;
    }

    await Haptics.impact({
      style: kind === 'damage' ? ImpactStyle.Medium : ImpactStyle.Light,
    });

    return true;
  } catch {
    return false;
  }
}
