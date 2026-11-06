import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Snapshot } from '/imports/observability/collections';
import { createCallsChart, updateCallsChart } from './chart';

import './admin.html';

// The first document only carries computedAt until a refresh fills it.
const liveSnapshot = () => {
  const snapshot = Snapshot.findOne('live');
  return snapshot?.series ? snapshot : null;
};

async function generateSampleTraffic() {
  const calls = Array.from({ length: 17 }, (_, index) =>
    Meteor.callAsync('tasks.insert', `Sample task ${index + 1}`));
  // Three empty tasks fail validation on purpose, to produce method.error events.
  for (let index = 0; index < 3; index += 1) calls.push(Meteor.callAsync('tasks.insert', '   '));
  await Promise.allSettled(calls);
}

Template.adminPage.onCreated(function () {
  this.inspected = new ReactiveVar('');
  this.subscribe('admin.snapshot');
});

Template.adminPage.onRendered(function () {
  this.chart = createCallsChart(this.find('#calls-chart'));
  this.autorun(() => {
    const snapshot = liveSnapshot();
    if (snapshot) updateCallsChart(this.chart, snapshot.series);
  });
});

Template.adminPage.onDestroyed(function () {
  this.chart?.destroy();
});

Template.adminPage.helpers({
  snapshot: liveSnapshot,
  isDevelopment: () => Meteor.isDevelopment,
  inspected: () => Template.instance().inspected.get(),
  ms: (value) => `${Math.round(value ?? 0)} ms`,
  percent: (value) => `${((value ?? 0) * 100).toFixed(1)} %`,
  minutes: (windowMs) => Math.round(windowMs / 60000),
  time: (date) => (date ? new Date(date).toLocaleTimeString() : ''),
  shortId: (id) => (id ? id.slice(0, 8) : ''),
});

Template.adminPage.events({
  'click .inspect'(event, instance) {
    // Payloads are shown as text, never as HTML.
    instance.inspected.set(JSON.stringify(this, null, 2));
    instance.find('dialog.inspector').showModal();
  },

  'click .traffic'() {
    generateSampleTraffic();
  },
});
