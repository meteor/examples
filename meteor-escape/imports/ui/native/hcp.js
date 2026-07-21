export const HCP_PREVIEW_VERSION = 'demo-preview';

export function listenForHcpUpdates(onUpdateAvailable) {
  const bridge = window.WebAppLocalServer;
  if (!bridge?.onNewVersionReady) {
    return () => {};
  }

  try {
    bridge.onNewVersionReady((version) => {
      onUpdateAvailable(version || 'available');
    });
  } catch (error) {
    console.warn('HCP update listener unavailable', error);
  }

  return () => {};
}

export async function checkForHcpUpdates() {
  const bridge = window.WebAppLocalServer;
  if (!bridge?.checkForUpdates) {
    return { checked: false };
  }

  try {
    await new Promise((resolve) => {
      bridge.checkForUpdates(resolve);
    });
    return { checked: true };
  } catch (error) {
    console.warn('HCP update check failed', error);
    return { checked: false, error };
  }
}

export async function applyHcpUpdate() {
  const bridge = window.WebAppLocalServer;
  if (!bridge?.switchToPendingVersion) {
    window.location.reload();
    return;
  }

  await new Promise((resolve, reject) => {
    bridge.switchToPendingVersion(resolve, reject);
  });
}
