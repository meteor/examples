import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

export default function NativeStatus() {
  const connected = useTracker(() => Meteor.status().connected);
  const ddpLabel = connected ? 'DDP connected' : 'DDP connecting';
  const capacitorLabel = Meteor.isCapacitor ? 'Meteor.isCapacitor true' : 'Meteor.isCapacitor false';

  return (
    <Stack className="native-status" direction="row" role="group" aria-label="Native status">
      <Chip size="small" label="Native ready" role="status" aria-label="Native ready" variant="outlined" />
      <Chip size="small" label={ddpLabel} role="status" aria-label={ddpLabel} />
      <Chip
        size="small"
        label={capacitorLabel}
        role="status"
        aria-label={capacitorLabel}
        variant="outlined"
      />
    </Stack>
  );
}
