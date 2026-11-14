import assert from 'assert';
import { capturePhoto } from '../imports/ui/native/camera';
import { listenForHcpUpdates } from '../imports/ui/native/hcp';
import * as hcpModule from '../imports/ui/native/hcp';
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

  it('holds a ready HCP bundle until install is approved', async function () {
    assert.strictEqual(typeof hcpModule.createHcpReloadConsent, 'function');

    let migrate;
    let retryCalls = 0;
    let switchCalls = 0;
    let browserReloadCalls = 0;
    let nativeCallback;
    const consent = hcpModule.createHcpReloadConsent();
    const bridge = {
      onNewVersionReady(callback) {
        nativeCallback = callback;
      },
      switchToPendingVersion(resolve) {
        switchCalls += 1;
        resolve();
      },
    };

    consent.install({
      _onMigrate(name, callback) {
        assert.strictEqual(name, 'native-hcp-consent');
        migrate = callback;
      },
    });
    hcpModule.listenForHcpUpdates(() => {}, bridge, consent);
    nativeCallback('1.2.0');

    assert.strictEqual(migrate(() => {
      retryCalls += 1;
    }), false);

    await hcpModule.applyHcpUpdate(
      bridge,
      () => {
        browserReloadCalls += 1;
      },
      consent
    );

    assert.strictEqual(retryCalls, 1);
    assert.strictEqual(switchCalls, 0);
    assert.strictEqual(browserReloadCalls, 0);
    assert.deepStrictEqual(migrate(() => {}), [true]);
  });

  it('replays an HCP event received before the dialog listener mounts', function () {
    let nativeCallback;
    const versions = [];
    const bridge = {
      onNewVersionReady(callback) {
        nativeCallback = callback;
      },
    };

    listenForHcpUpdates(() => {}, bridge);
    nativeCallback('1.3.0');
    listenForHcpUpdates((version) => versions.push(version), bridge);

    assert.deepStrictEqual(versions, ['1.3.0']);
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
