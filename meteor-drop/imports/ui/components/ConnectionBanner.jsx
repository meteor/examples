import React from 'react';

export function ConnectionBanner({ connected, status, ddpEnabled, networkStatus }) {
  if (networkStatus.connected && ddpEnabled && connected) {
    return null;
  }

  let label = 'Reconnecting to Meteor. Match controls resume when the link is back.';

  if (!networkStatus.connected) {
    label = 'Offline. Match controls pause until the connection returns.';
  } else if (!ddpEnabled) {
    label = 'Live board sync paused. Re-enable DDP in System information.';
  } else if (status !== 'waiting') {
    label = 'Link interrupted. Match controls resume when the live feed reconnects.';
  }

  return (
    <div className="connection-banner" role="status" aria-live="polite">
      <span className="connection-banner__dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
