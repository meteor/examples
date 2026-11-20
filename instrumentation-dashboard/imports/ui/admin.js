import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import 'meteor/dupontbertrand:gridstack';
import { Snapshot } from '/imports/observability/collections';
import { Layouts, COLUMNS, panelsIn } from '/imports/admin/layout';
import { createCallsChart, updateCallsChart } from './chart';

import './admin.html';

// The first document only carries computedAt until a refresh fills it.
const liveSnapshot = () => {
  const snapshot = Snapshot.findOne('live');
  return snapshot?.series ? snapshot : null;
};

// The event shown in the inspector dialog.
const inspected = new ReactiveVar('');

async function generateSampleTraffic() {
  const calls = Array.from({ length: 17 }, (_, index) =>
    Meteor.callAsync('tasks.insert', `Sample task ${index + 1}`));
  // Three empty tasks fail validation on purpose, to produce method.error events.
  for (let index = 0; index < 3; index += 1) calls.push(Meteor.callAsync('tasks.insert', '   '));
  await Promise.allSettled(calls);
}

Template.adminPage.onCreated(function () {
  this.subscribe('admin.snapshot');
  this.subscribe('admin.layout');
});

// Each panel is a template of its own, rendered by the grid: they share these.
const formatting = {
  snapshot: liveSnapshot,
  ms: (value) => (value === null ? 'no sample' : value === undefined ? '' : `${Math.round(value)} ms`),
  percent: (value) => `${((value ?? 0) * 100).toFixed(1)} %`,
  minutes: (windowMs) => Math.round(windowMs / 60000),
  time: (date) => (date ? new Date(date).toLocaleTimeString() : ''),
  shortId: (id) => (id ? id.slice(0, 8) : ''),
};
for (const name of ['adminPage', 'adminTiles', 'adminInstances', 'adminMethods', 'adminEvents']) {
  Template[name].helpers(formatting);
}

Template.adminPage.helpers({
  isDevelopment: () => Meteor.isDevelopment,
  inspected: () => inspected.get(),
  // Reactive: a layout saved in another dashboard moves the panels here too.
  panels: () => panelsIn(Layouts.findOne('admin')),
  // Panels are dragged by their title, so that tables and buttons keep their
  // clicks. One column on narrow screens.
  gridOptions: () => ({
    column: COLUMNS,
    cellHeight: 76,
    margin: 6,
    handle: '.panel-title',
    columnOpts: { breakpoints: [{ w: 700, c: 1 }], columnMax: COLUMNS },
  }),
  // Called after a person drags or resizes a panel in the full grid, not when the
  // panels stack on a narrow screen.
  saveLayout: () => (layout) => Meteor.callAsync('admin.saveLayout', layout).catch(() => {}),
});

Template.adminPage.events({
  'click .traffic'() {
    generateSampleTraffic();
  },
  'click .reset-layout'() {
    Meteor.callAsync('admin.resetLayout');
  },
});

Template.adminChart.onRendered(function () {
  this.chart = createCallsChart(this.find('#calls-chart'));
  this.autorun(() => {
    const snapshot = liveSnapshot();
    if (snapshot) updateCallsChart(this.chart, snapshot.series);
  });
});

Template.adminChart.onDestroyed(function () {
  this.chart?.destroy();
});

Template.adminEvents.events({
  'click .inspect'() {
    // Payloads are shown as text, never as HTML.
    inspected.set(JSON.stringify(this, null, 2));
    document.querySelector('dialog.inspector').showModal();
  },
});
