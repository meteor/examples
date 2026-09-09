export const HCP_PREVIEW_VERSION = 'demo-preview';

const listenerRegistries = new WeakMap();

export function createHcpReloadConsent() {
  let installed = false;
  let updateReady = false;
  let retryReload;

  return {
    install(reload) {
      if (installed || typeof reload?._onMigrate !== 'function') {
        return false;
      }

      reload._onMigrate('native-hcp-consent', (retry) => {
        if (!updateReady) {
          return [true];
        }

        retryReload = retry;
        return false;
      });
      installed = true;
      return true;
    },
    markUpdateReady() {
      updateReady = true;
    },
    release({ retry: retryMigration = true } = {}) {
      if (!installed || !updateReady) {
        return false;
      }

      updateReady = false;
      const retry = retryReload;
      retryReload = undefined;
      if (retryMigration) {
        retry?.();
      }
      return true;
    },
  };
}

export const hcpReloadConsent = createHcpReloadConsent();

function createListenerRegistry(bridge, consent) {
  const registry = {
    listeners: new Set(),
    nativeHandle: undefined,
    latestVersion: undefined,
  };

  registry.nativeHandle = bridge.onNewVersionReady((version) => {
    const readyVersion = version || 'available';
    registry.latestVersion = readyVersion;
    consent.markUpdateReady();

    for (const listener of registry.listeners) {
      listener(readyVersion);
    }
  });
  listenerRegistries.set(bridge, registry);
  return registry;
}

function removeNativeListener(registry) {
  if (typeof registry.nativeHandle === 'function') {
    registry.nativeHandle();
    return true;
  }

  if (typeof registry.nativeHandle?.remove === 'function') {
    void registry.nativeHandle.remove();
    return true;
  }

  return false;
}

export function listenForHcpUpdates(
  onUpdateAvailable,
  bridge = globalThis.window?.WebAppLocalServer,
  consent = hcpReloadConsent
) {
  if (!bridge?.onNewVersionReady) {
    return () => {};
  }

  let registry;

  try {
    registry = listenerRegistries.get(bridge) ?? createListenerRegistry(bridge, consent);
    registry.listeners.add(onUpdateAvailable);
    if (registry.latestVersion) {
      onUpdateAvailable(registry.latestVersion);
    }
  } catch (error) {
    console.warn('HCP update listener unavailable', error);
    return () => {};
  }

  return () => {
    registry.listeners.delete(onUpdateAvailable);

    if (registry.listeners.size === 0 && removeNativeListener(registry)) {
      listenerRegistries.delete(bridge);
    }
  };
}

async function waitForPendingUpdate(plugin, pause, attempts = 80) {
  if (!plugin?.isUpdateAvailable) {
    return false;
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await plugin.isUpdateAvailable();
    if (result?.available) {
      return true;
    }
    await pause(250);
  }

  return false;
}

export async function checkForHcpUpdates(
  bridge = globalThis.window?.WebAppLocalServer,
  plugin = globalThis.window?.Capacitor?.Plugins?.CapacitorMeteorWebApp,
  pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
) {
  if (!bridge?.checkForUpdates) {
    return { checked: false };
  }

  try {
    await new Promise((resolve) => {
      bridge.checkForUpdates(resolve);
    });
    const updateReady = await waitForPendingUpdate(plugin, pause);
    return { checked: true, updateReady };
  } catch (error) {
    console.warn('HCP update check failed', error);
    return { checked: false, error };
  }
}

export async function applyHcpUpdate(
  bridge = globalThis.window?.WebAppLocalServer,
  reloadPage = () => globalThis.window?.location.reload(),
  consent = hcpReloadConsent
) {
  if (bridge?.switchToPendingVersion) {
    consent.release({ retry: false });
    await new Promise((resolve, reject) => {
      bridge.switchToPendingVersion(resolve, reject);
    });
    return;
  }

  if (consent.release()) {
    return;
  }

  reloadPage();
}
