import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

export default function NativeStatus() {
  const connected = useTracker(() => Meteor.status().connected);

  const ddpLabel = connected ? 'DDP connected' : 'DDP connecting';
  const capacitorLabel = Meteor.isCapacitor ? 'Meteor.isCapacitor true' : 'Meteor.isCapacitor false';

  return (
    <div className="native-status">
      <span className="status-pill" aria-label="Native ready">Ready to file</span>
      <span className="status-pill" aria-label={ddpLabel}>
        {connected ? 'Live queue' : 'Queue syncing'}
      </span>
      <span className="status-pill" aria-label={capacitorLabel}>
        {Meteor.isCapacitor ? 'Phone shell' : 'Browser preview'}
      </span>
    </div>
  );
}
