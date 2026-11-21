import React from 'react';
import TouchButton from './TouchButton';

export default function HcpUpdateReminder({ visible, onReview }) {
  if (!visible) return null;

  return (
    <aside className="hcp-update-reminder" role="status" aria-live="polite">
      <div>
        <strong>Update ready</strong>
        <span>Fresh app version downloaded</span>
      </div>
      <TouchButton
        className="hcp-update-reminder-action"
        aria-label="Review update"
        onPress={onReview}
      >
        Review
      </TouchButton>
    </aside>
  );
}
