import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

export default function NativeStatus() {
  const connected = useTracker(() => Meteor.status().connected);

  const ddpLabel = connected ? 'DDP connected' : 'DDP connecting';
  const capacitorLabel = Meteor.isCapacitor ? 'Meteor.isCapacitor true' : 'Meteor.isCapacitor false';

  return (
    <div className="native-status">
      <span className="status-pill" role="status" aria-label="Native ready">Native ready</span>
      <span className="status-pill" role="status" aria-label={ddpLabel}>
        {ddpLabel}
      </span>
      <span className="status-pill" role="status" aria-label={capacitorLabel}>
        {capacitorLabel}
      </span>
    </div>
  );
}
