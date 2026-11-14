import { Meteor } from 'meteor/meteor';

const defaults = {
  enabled: true,
  eventsMaxBytes: 5 * 1024 * 1024,
  eventsMaxDocs: 20000,
  flushMs: 250,
  refreshMs: 2000,
  windowMs: 5 * 60 * 1000,
  rollupTtlSeconds: 24 * 60 * 60,
  maxQueue: 5000,
};

export const observabilitySettings = { ...defaults, ...Meteor.settings.observability };
