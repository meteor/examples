import React from 'react';
import { Button } from 'konsta/react';
import { RefreshCw } from 'lucide-react';
import { useDialogFocusTrap } from '../useDialogFocusTrap';

export function HcpUpdateReminder({ visible, onReview }) {
  if (!visible) {
    return null;
  }

  return (
    <aside className="hcp-update-reminder" role="status" aria-live="polite">
      <RefreshCw size={20} aria-hidden="true" />
      <div className="hcp-update-reminder__copy">
        <strong>Update ready</strong>
        <span>Fresh Meteor Drop build downloaded</span>
      </div>
      <button
        className="hcp-update-reminder__action"
        type="button"
        aria-label="Review update"
        onClick={onReview}
      >
        Review
      </button>
    </aside>
  );
}

export function HcpUpdateDialog({ installing, opened, updateVersion, onDismiss, onInstall }) {
  const { dialogRef, onDialogKeyDown } = useDialogFocusTrap({
    opened,
    onDismiss,
    dismissDisabled: installing,
  });

  if (!updateVersion || !opened) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={installing ? undefined : onDismiss}>
      <section
        className="dialog-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meteor-hcp-dialog-title"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-sheet__header">
          <p className="eyebrow">Update ready</p>
          <h2 id="meteor-hcp-dialog-title">New app update available</h2>
        </div>

        <p className="dialog-sheet__detail">
          Version {updateVersion} is ready to install. The app will refresh after the update is
          applied.
        </p>

        <div className="dialog-sheet__actions">
          <Button className="dialog-sheet__button" onClick={onDismiss} disabled={installing}>
            Not now
          </Button>
          <Button
            tonal={false}
            className="dialog-sheet__button dialog-sheet__button--primary"
            onClick={onInstall}
            disabled={installing}
          >
            Install update
          </Button>
        </div>
      </section>
    </div>
  );
}
