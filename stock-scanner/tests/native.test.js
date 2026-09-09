import assert from 'assert';
import { scanBarcode } from '../imports/ui/native/barcode';
import { listenForHcpUpdates } from '../imports/ui/native/hcp';
import * as hcpModule from '../imports/ui/native/hcp';

describe('Stock Scanner native adapters', function () {
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

  it('rejects native barcode failures instead of returning an ignored error field', async function () {
    await assert.rejects(
      () =>
        scanBarcode({
          capacitor: { isNativePlatform: () => true },
          scanner: {
            scanBarcode: async () => {
              throw new Error('camera denied');
            },
          },
        }),
      /camera denied/
    );
  });
});
