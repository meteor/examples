import { Meteor } from 'meteor/meteor';
import '/imports/api/tasks/methods';
import '/imports/api/tasks/publications';
import { Snapshot } from '/imports/observability/collections';
import { startObservability } from '/imports/observability/server';
import { requireAdmin } from '/imports/admin/authorization';
import { Layouts } from '/imports/admin/layout';

Meteor.publish('admin.snapshot', async function () {
  if (!(await requireAdmin(this.userId))) {
    this.error(new Meteor.Error('not-authorized'));
    return;
  }
  return Snapshot.find('live');
});

Meteor.publish('admin.layout', async function () {
  if (!(await requireAdmin(this.userId))) {
    this.error(new Meteor.Error('not-authorized'));
    return;
  }
  return Layouts.find('admin');
});

Meteor.startup(async () => {
  await startObservability();
});
