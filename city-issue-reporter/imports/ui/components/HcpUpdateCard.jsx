import React from 'react';
import TouchButton from './TouchButton';

export default function HcpUpdateCard({ checking, message, onCheck, onPreview }) {
  return (
    <div className="hcp-card">
      <div className="card-icon" aria-hidden="true">UP</div>
      <div className="hcp-card-copy">
        <div className="section-label">App updates</div>
        <h2>Keep field crews current</h2>
        <p>
          Prompt staff before refreshing to the latest intake checklist, so
          active reports stay in context.
        </p>
        {message && <div className="inline-status">{message}</div>}
        <div className="action-row">
          <TouchButton
            className="button button-fill"
            onPress={onCheck}
            disabled={checking}
          >
            {checking ? 'Checking...' : 'Check for update'}
          </TouchButton>
          <TouchButton
            className="button button-outline"
            aria-label="Preview HCP update"
            onPress={onPreview}
          >
            Preview prompt
          </TouchButton>
        </div>
      </div>
    </div>
  );
}
