import React from 'react';

export function ConnectionBanner({ connection }) {
  if (connection.connected) {
    return null;
  }

  const label =
    connection.status === 'waiting'
      ? 'Reconnecting to Meteor. Mission controls resume when the link is back.'
      : 'Offline. Mission controls wait until the live data link returns.';

  return (
    <div className="connection-banner" role="status" aria-live="polite">
      <span className="connection-banner__dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
