import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import * as d3 from 'd3';
import { Parties } from '../api/parties/collection';
import { attending } from '../api/parties/helpers';

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
    Session.set("createCoords", {x: x, y: y});
    Session.set("createError", null);
    Session.set("showCreateDialog", true);
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
