import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Offline } from 'meteor/jam:offline';
import { PubSub } from 'meteor/jam:pub-sub';
import { makeOfflineHydrationIdempotent } from './offlineHydration';

Offline.configure({
  keepAll: false,
  autoSync: true,
  sort: { updatedAt: -1 },
  limit: 200,
});

PubSub.configure({
  cache: true,
});

export const IssueReports = new Mongo.Collection('issue_reports');

if (Meteor.isClient) {
  makeOfflineHydrationIdempotent(IssueReports._collection);
}

IssueReports.keep(
  { status: { $in: ['draft', 'submitted', 'in review'] } },
  { sort: { updatedAt: -1 }, limit: 200 }
);
