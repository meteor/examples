import React from 'react';
import { Sheet } from 'framework7-react';
import TouchButton from './TouchButton';
import useModalFocus from '../useModalFocus';

export default function HcpUpdateDialog({
  installing,
  updateVersion,
  onDismiss,
  onInstall,
}) {
  useModalFocus(Boolean(updateVersion), '.hcp-sheet');

  return (
    <Sheet
      opened={Boolean(updateVersion)}
      backdrop
      closeByBackdropClick
      closeOnEscape
      swipeToClose
      className="hcp-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="civic-hcp-dialog-title"
      onSheetClosed={() => {
        if (updateVersion) onDismiss();
      }}
    >
      <div className="sheet-swipe-handle" aria-hidden="true" />
      <div className="hcp-sheet-content">
        <div className="section-label">Update ready</div>
        <h2 id="civic-hcp-dialog-title">New app update available</h2>
        <p>
          Version {updateVersion} is ready to install. The app will refresh after the update is applied.
        </p>
        <div className="dialog-actions">
          <TouchButton
            className="button button-outline button-large"
            onPress={onDismiss}
            disabled={installing}
          >
            Not now
          </TouchButton>
          <TouchButton
            className="button button-fill button-large"
            onPress={onInstall}
            disabled={installing}
          >
            Install update
          </TouchButton>
        </div>
      </div>
    </Sheet>
  );
}
