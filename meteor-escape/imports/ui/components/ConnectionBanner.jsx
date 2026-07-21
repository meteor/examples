import React from 'react';

export function ConnectionBanner({ connected, status, ddpEnabled, networkStatus }) {
  if (networkStatus.connected && ddpEnabled && connected) {
    return null;
  }

  let label = 'Reconnecting to Meteor. Mission controls resume when the link is back.';

  if (!networkStatus.connected) {
    label = 'Offline. Mission controls pause until the ship link returns.';
  } else if (!ddpEnabled) {
    label = 'Live mission sync paused. Re-enable the ship link in System information.';
  } else if (status !== 'waiting') {
    label = 'Link interrupted. Mission controls resume when the live feed reconnects.';
  }

  return (
    <div className="connection-banner" role="status" aria-live="polite">
      <span className="connection-banner__dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
