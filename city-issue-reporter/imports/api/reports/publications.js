import { Meteor } from 'meteor/meteor';
import { IssueReports } from './collection';

Meteor.publish('reports.byOwner', function (ownerId) {
  if (typeof ownerId !== 'string' || ownerId.length === 0) {
    return this.ready();
  }

  return IssueReports.find(
    { ownerId },
    {
      sort: { updatedAt: -1 },
    }
  );
});
