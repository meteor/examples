import { Mongo } from 'meteor/mongo';

// Raw events, in a capped collection: MongoDB keeps only the newest ones.
export const Events = new Mongo.Collection('instrumentation_events');
// Per-minute counters for each method, expired by a TTL index.
export const Rollups = new Mongo.Collection('instrumentation_rollups');
// One heartbeat document per server process.
export const Instances = new Mongo.Collection('instrumentation_instances');
// The single document the dashboard subscribes to.
export const Snapshot = new Mongo.Collection('instrumentation_snapshot');
