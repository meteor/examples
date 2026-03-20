import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import $ from 'jquery';
import * as d3 from 'd3';
import _ from 'lodash';
import { Parties, displayName, attending } from '../imports/model'

import './main.html';

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

///////////////////////////////////////////////////////////////////////////////
// Party details sidebar

Template.details.helpers({
  party: function () {
    return Parties.findOne(Session.get("selected"));
  },
  anyParties: function () {
    return Parties.find().count() > 0;
  },
  creatorName: function () {
    const owner = Meteor.users.findOne(this.owner);
    if (owner._id === Meteor.userId())
      return "me";
    return displayName(owner);
  },
  canRemove: function () {
    return this.owner === Meteor.userId() && attending(this) === 0;
  },
  rsvpBtnClass: function (what) {
    const myRsvp = _.find(this.rsvps, function (r) {
      return r.user === Meteor.userId();
    }) || {};
    return what === myRsvp.rsvp ? "rsvp-active-" + what : "";
  }
});

Template.details.events({
  'click .rsvp_yes': function () {
    Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function () {
    Meteor.call("rsvp", Session.get("selected"), "maybe");
    return false;
  },
  'click .rsvp_no': function () {
    Meteor.call("rsvp", Session.get("selected"), "no");
    return false;
  },
  'click .invite': function () {
    openInviteDialog();
    return false;
  },
  'click .remove': function () {
    Parties.remove(this._id);
    return false;
  }
});

///////////////////////////////////////////////////////////////////////////////
// Party attendance widget

Template.attendance.helpers({
  rsvpName: function () {
    const user = Meteor.users.findOne(this.user);
    return displayName(user);
  },

  outstandingInvitations: function () {
    const party = Parties.findOne(this._id);
    return Meteor.users.find({$and: [
        {_id: {$in: party.invited}}, // they're invited
        {_id: {$nin: _.map(party.rsvps, 'user')}} // but haven't RSVP'd
      ]});
  },

  invitationName: function () {
    return displayName(this);
  },

  rsvpIs: function (what) {
    return this.rsvp === what;
  },

  nobody: function () {
    return !this.public && (this.rsvps.length + this.invited.length === 0);
  },

  canInvite: function () {
    return !this.public && this.owner === Meteor.userId();
  }
});

///////////////////////////////////////////////////////////////////////////////
// Map display

Template.map.events({
  'mousedown circle, mousedown text': function (event, template) {
    Session.set("selected", event.currentTarget.id);
  },
  'dblclick .map': function (event, template) {
    if (!Meteor.userId()) // must be logged in to create events
      return;
    const svg = event.currentTarget.querySelector('svg');
    const rect = svg.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    openCreateDialog(x, y);
  }
});

Template.map.onRendered(function () {
  const self = this;
  self.node = self.find("svg");

  if (!self.handle) {
    self.handle = Tracker.autorun(function () {
      const selected = Session.get('selected');
      const selectedParty = selected && Parties.findOne(selected);
      const radius = function (party) {
        return 10 + Math.sqrt(attending(party)) * 10;
      };

      // Draw a circle for each party
      const updateCircles = (group) => {
        group.attr("id", function (party) { return party._id; })
          .attr("cx", function (party) { return party.x * 500; })
          .attr("cy", function (party) { return party.y * 500; })
          .attr("r", radius)
          .attr("class", function (party) {
            return party.public ? "public" : "private";
          })
          .style('opacity', function (party) {
            return selected === party._id ? 1 : 0.7;
          })
          .style('cursor', 'pointer');
      };

      const circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Parties.find().fetch(), function (party) { return party._id; });

      // Entrance animation for new circles
      const entering = circles.enter().append("circle")
        .attr("cx", function (party) { return party.x * 500; })
        .attr("cy", function (party) { return party.y * 500; })
        .attr("r", 0)
        .attr("class", function (party) {
          return party.public ? "public" : "private";
        })
        .attr("id", function (party) { return party._id; })
        .style('cursor', 'pointer')
        .style('opacity', 0);

      entering.transition().duration(400).ease(d3.easeBackOut)
        .attr("r", radius)
        .style('opacity', function (party) {
          return selected === party._id ? 1 : 0.7;
        });

      updateCircles(circles.transition().duration(250).ease(d3.easeCubicOut));
      circles.exit().transition().duration(250).attr("r", 0).style('opacity', 0).remove();

      // Label each with the current attendance count
      const updateLabels = (group) => {
        group.attr("id", function (party) { return party._id; })
          .text(function (party) {return attending(party) || '';})
          .attr("x", function (party) { return party.x * 500; })
          .attr("y", function (party) { return party.y * 500 + radius(party)/2 })
          .style('font-size', function (party) {
            return radius(party) * 1.25 + "px";
          });
      };

      const labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Parties.find().fetch(), function (party) { return party._id; });

      updateLabels(labels.enter().append("text"));
      updateLabels(labels.transition().duration(250).ease(d3.easeCubicOut));
      labels.exit().remove();

      // Draw a glowing circle around the currently selected party
      const callout = d3.select(self.node).select("circle.callout")
        .transition().duration(300).ease(d3.easeCubicOut);
      if (selectedParty)
        callout.attr("cx", selectedParty.x * 500)
          .attr("cy", selectedParty.y * 500)
          .attr("r", radius(selectedParty) + 12)
          .attr("class", "callout")
          .attr("display", '');
      else
        callout.attr("display", 'none');
    });
  }
});

Template.map.onDestroyed = function () {
  this.handle && this.handle.stop();
};

///////////////////////////////////////////////////////////////////////////////
// Create Party dialog

const openCreateDialog = function (x, y) {
  Session.set("createCoords", {x: x, y: y});
  Session.set("createError", null);
  Session.set("showCreateDialog", true);
};

Template.page.helpers({
  showCreateDialog: function () {
    return Session.get("showCreateDialog");
  },
  showInviteDialog: function () {
    return Session.get("showInviteDialog");
  }
});

Template.createDialog.events({
  'click .save': function (event, template) {
    const title = template.find(".title").value;
    const description = template.find(".description").value;
    const isPublic = !template.find(".private").checked;
    const coords = Session.get("createCoords");

    if (title.length && description.length) {
      Meteor.call('createParty', {
        title: title,
        description: description,
        x: coords.x,
        y: coords.y,
        public: isPublic
      }, function (error, id) {
        if (id) {
          Session.set("selected", id);
          if (!isPublic && Meteor.users.find().count() > 1)
            openInviteDialog();
        }
      });
      Session.set("showCreateDialog", false);
    } else {
      Session.set("createError",
        "It needs a title and a description, or why bother?");
    }
  },

  'click .cancel': function () {
    Session.set("showCreateDialog", false);
  }
});

Template.createDialog.helpers({
  error: function () {
    return Session.get("createError");
  }
});

///////////////////////////////////////////////////////////////////////////////
// Invite dialog

const openInviteDialog = function () {
  Session.set("showInviteDialog", true);
};

Template.inviteDialog.events({
  'click .invite': function (event, template) {
    Meteor.call('invite', Session.get("selected"), this._id);
  },
  'click .done': function (event, template) {
    Session.set("showInviteDialog", false);
    return false;
  }
});

Template.inviteDialog.helpers({
  uninvited: function () {
    const party = Parties.findOne(Session.get("selected"));
    if (!party)
      return []; // party hasn't loaded yet
    return Meteor.users.find({$nor: [{_id: {$in: party.invited}},
        {_id: party.owner}]});
  },

  displayName: function () {
    return displayName(this);
  }
});
