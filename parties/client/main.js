import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Parties } from '/imports/api/parties/collection';
import '/imports/api/parties/methods';

import './main.html';

import '/imports/ui/details';
import '/imports/ui/attendance';
import '/imports/ui/map';
import '/imports/ui/page';
import '/imports/ui/createDialog';
import '/imports/ui/inviteDialog';

// All Tomorrow's Parties -- client

Meteor.subscribe("directory");
Meteor.subscribe("parties");

// If no party selected, or if the selected party was deleted, select one.
Meteor.startup(function () {
  Tracker.autorun(function () {
    const selected = Session.get("selected");
    if (!selected || !Parties.findOne(selected)) {
      const party = Parties.findOne();
      if (party)
        Session.set("selected", party._id);
      else
        Session.set("selected", null);
    }
  });
});
