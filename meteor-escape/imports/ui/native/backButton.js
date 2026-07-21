import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useRef } from 'react';

export const NATIVE_BACK_ACTIONS = {
  DISMISS_HCP_DIALOG: 'dismiss-hcp-dialog',
  DISMISS_CREW_SHEET: 'dismiss-crew-sheet',
  DISMISS_RESULT_SHEET: 'dismiss-result-sheet',
  DISMISS_MISSION_CONFIRMATION: 'dismiss-mission-confirmation',
  CONFIRM_ACTIVE_MISSION: 'confirm-active-mission',
  GO_TO_PLAY: 'go-to-play',
  EXIT_APP: 'exit-app',
};

export function resolveNativeBackAction({
  hcpDialogOpen,
  crewSheetOpen,
  resultSheetOpen,
  missionExitConfirmOpen,
  hasActiveMission,
  view,
}) {
  if (hcpDialogOpen) {
    return NATIVE_BACK_ACTIONS.DISMISS_HCP_DIALOG;
  }

  if (crewSheetOpen) {
    return NATIVE_BACK_ACTIONS.DISMISS_CREW_SHEET;
  }

  if (resultSheetOpen) {
    return NATIVE_BACK_ACTIONS.DISMISS_RESULT_SHEET;
  }

  if (missionExitConfirmOpen) {
    return NATIVE_BACK_ACTIONS.DISMISS_MISSION_CONFIRMATION;
  }

  if (hasActiveMission) {
    return NATIVE_BACK_ACTIONS.CONFIRM_ACTIVE_MISSION;
  }

  if (view !== 'play') {
    return NATIVE_BACK_ACTIONS.GO_TO_PLAY;
  }

  return NATIVE_BACK_ACTIONS.EXIT_APP;
}

export function useNativeBackButton(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    let disposed = false;
    let listener;

    void CapacitorApp.addListener('backButton', () => handlerRef.current())
      .then((handle) => {
        if (disposed) {
          void handle.remove();
        } else {
          listener = handle;
        }
      })
      .catch((error) => console.warn('Unable to register native Back navigation', error));

    return () => {
      disposed = true;
      if (listener) {
        void listener.remove();
      }
    };
  }, []);
}

export function exitNativeApp() {
  return CapacitorApp.exitApp();
}
