import assert from 'assert';
import {
  NATIVE_BACK_ACTIONS,
  resolveNativeBackAction,
} from '../imports/ui/native/backButton';

describe('native back button', function () {
  it('resolves overlays before navigation or exit', function () {
    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: true,
        liveMatchSheetOpen: true,
        resultSheetOpen: true,
        matchExitConfirmOpen: true,
        hasActiveMatch: true,
        view: 'system',
      }),
      NATIVE_BACK_ACTIONS.DISMISS_HCP_DIALOG
    );

    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        liveMatchSheetOpen: true,
        resultSheetOpen: true,
        matchExitConfirmOpen: true,
        hasActiveMatch: true,
        view: 'system',
      }),
      NATIVE_BACK_ACTIONS.DISMISS_LIVE_MATCH_SHEET
    );

    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        liveMatchSheetOpen: false,
        resultSheetOpen: true,
        matchExitConfirmOpen: true,
        hasActiveMatch: true,
        view: 'system',
      }),
      NATIVE_BACK_ACTIONS.DISMISS_RESULT_SHEET
    );

    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        liveMatchSheetOpen: false,
        resultSheetOpen: false,
        matchExitConfirmOpen: true,
        hasActiveMatch: true,
        view: 'match',
      }),
      NATIVE_BACK_ACTIONS.DISMISS_MATCH_CONFIRMATION
    );
  });

  it('confirms a live match before switching tabs or exiting', function () {
    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        liveMatchSheetOpen: false,
        resultSheetOpen: false,
        matchExitConfirmOpen: false,
        hasActiveMatch: true,
        view: 'match',
      }),
      NATIVE_BACK_ACTIONS.CONFIRM_ACTIVE_MATCH
    );

    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        liveMatchSheetOpen: false,
        resultSheetOpen: false,
        matchExitConfirmOpen: false,
        hasActiveMatch: false,
        view: 'records',
      }),
      NATIVE_BACK_ACTIONS.GO_TO_PLAY
    );

    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        liveMatchSheetOpen: false,
        resultSheetOpen: false,
        matchExitConfirmOpen: false,
        hasActiveMatch: false,
        view: 'play',
      }),
      NATIVE_BACK_ACTIONS.EXIT_APP
    );
  });
});
