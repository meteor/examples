import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export async function scheduleFollowUp({ reportId, title }) {
  if (!Capacitor.isNativePlatform()) {
    return { scheduled: false, reason: 'unsupported' };
  }

  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') {
    return { scheduled: false, reason: 'denied' };
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.abs(reportId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)),
        title: 'Civic Snap follow-up',
        body: title,
        schedule: { at: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      },
    ],
  });

  return { scheduled: true };
}
