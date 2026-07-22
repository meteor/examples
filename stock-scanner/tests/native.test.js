import assert from 'assert';
import { scanBarcode } from '../imports/ui/native/barcode';
import { listenForHcpUpdates } from '../imports/ui/native/hcp';

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

