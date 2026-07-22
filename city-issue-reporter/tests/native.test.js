import assert from 'assert';
import { capturePhoto } from '../imports/ui/native/camera';
import { listenForHcpUpdates } from '../imports/ui/native/hcp';
import { listenNetworkStatus } from '../imports/ui/native/network';

describe('Civic Snap native adapters', function () {
  it('stops HCP callbacks and removes native listener handles on cleanup', function () {
    const versions = [];
    let nativeCallback;
    let removed = false;
    const bridge = {
      onNewVersionReady(callback) {
        nativeCallback = callback;
        return {
          remove() {
            removed = true;
          },
        };
      },
    };
    const cleanup = listenForHcpUpdates((version) => versions.push(version), bridge);

    nativeCallback('1.1.0');
    cleanup();
    nativeCallback('1.2.0');

    assert.deepStrictEqual(versions, ['1.1.0']);
    assert.strictEqual(removed, true);
  });

  it('removes a native network listener that resolves after cleanup', async function () {
    let resolveHandle;
    let removeCalls = 0;
    const cleanup = listenNetworkStatus(() => {}, {
      capacitor: { isNativePlatform: () => true },
      network: {
        addListener: () =>
          new Promise((resolve) => {
            resolveHandle = resolve;
          }),
      },
      navigatorLike: { onLine: true },
      windowLike: {
        addEventListener() {},
        removeEventListener() {},
      },
    });

    cleanup();
    resolveHandle({
      remove() {
        removeCalls += 1;
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.strictEqual(removeCalls, 1);
  });

  it('rejects native camera failures instead of returning an ignored error field', async function () {
    await assert.rejects(
      () =>
        capturePhoto({
          capacitor: { isNativePlatform: () => true },
          camera: {
            getPhoto: async () => {
              throw new Error('camera denied');
            },
          },
        }),
      /camera denied/
    );
  });
});

