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
        crewSheetOpen: true,
        resultSheetOpen: true,
        missionExitConfirmOpen: true,
        hasActiveMission: true,
        view: 'system',
      }),
      NATIVE_BACK_ACTIONS.DISMISS_HCP_DIALOG
    );

    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        crewSheetOpen: true,
        resultSheetOpen: true,
        missionExitConfirmOpen: true,
        hasActiveMission: true,
        view: 'system',
      }),
      NATIVE_BACK_ACTIONS.DISMISS_CREW_SHEET
    );

    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        crewSheetOpen: false,
        resultSheetOpen: true,
        missionExitConfirmOpen: true,
        hasActiveMission: true,
        view: 'system',
      }),
      NATIVE_BACK_ACTIONS.DISMISS_RESULT_SHEET
    );
  });

  it('confirms live mission before switching tabs or exiting', function () {
    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        crewSheetOpen: false,
        resultSheetOpen: false,
        missionExitConfirmOpen: false,
        hasActiveMission: true,
        view: 'mission',
      }),
      NATIVE_BACK_ACTIONS.CONFIRM_ACTIVE_MISSION
    );

    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        crewSheetOpen: false,
        resultSheetOpen: false,
        missionExitConfirmOpen: false,
        hasActiveMission: false,
        view: 'records',
      }),
      NATIVE_BACK_ACTIONS.GO_TO_PLAY
    );

    assert.strictEqual(
      resolveNativeBackAction({
        hcpDialogOpen: false,
        crewSheetOpen: false,
        resultSheetOpen: false,
        missionExitConfirmOpen: false,
        hasActiveMission: false,
        view: 'play',
      }),
      NATIVE_BACK_ACTIONS.EXIT_APP
    );
  });
});
