import { Meteor } from 'meteor/meteor';
import { createMethod } from 'meteor/jam:method';
import { IssueReports } from './collection';
import {
  CreateReportSchema,
  SetStatusSchema,
  SubmitReportSchema,
  UpdateReportSchema,
} from './schema';

async function assertOwns(reportId, ownerId) {
  const report = await IssueReports.findOneAsync({ _id: reportId, ownerId });
  if (!report) throw new Meteor.Error('not-found', 'Report not found');
  return report;
}

function assertTransition(from, to) {
  const allowed = {
    submitted: ['in review'],
    'in review': ['fixed'],
  };

  if (!allowed[from]?.includes(to)) {
    throw new Meteor.Error('invalid-state', `Cannot move report from ${from} to ${to}`);
  }
}

export const createDraft = createMethod({
  name: 'reports.createDraft',
  schema: CreateReportSchema,
  open: true,
  async run({ ownerId, category }) {
    const now = new Date();
    const reportId = await IssueReports.insertAsync({
      ownerId,
      category,
      title: `${category} report`,
      description: '',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });

    return { reportId };
  },
});

export const updateDraft = createMethod({
  name: 'reports.updateDraft',
  schema: UpdateReportSchema,
  open: true,
  async run({ ownerId, reportId, patch }) {
    const report = await assertOwns(reportId, ownerId);
    if (report.status !== 'draft') {
      throw new Meteor.Error('invalid-state', 'Only draft reports can be edited');
    }

    await IssueReports.updateAsync(reportId, {
      $set: { ...patch, updatedAt: new Date() },
    });

    return { reportId };
  },
});

export const submit = createMethod({
  name: 'reports.submit',
  schema: SubmitReportSchema,
  open: true,
  async run({ ownerId, reportId }) {
    const report = await assertOwns(reportId, ownerId);
    if (report.status !== 'draft') {
      throw new Meteor.Error('invalid-state', 'Only draft reports can be submitted');
    }

    await IssueReports.updateAsync(reportId, {
      $set: { status: 'submitted', submittedAt: new Date(), updatedAt: new Date() },
    });

    return { reportId, status: 'submitted' };
  },
});

export const setStatus = createMethod({
  name: 'reports.setStatus',
  schema: SetStatusSchema,
  open: true,
  async run({ ownerId, reportId, status }) {
    const report = await assertOwns(reportId, ownerId);
    assertTransition(report.status, status);

    await IssueReports.updateAsync(reportId, {
      $set: { status, updatedAt: new Date() },
    });

    return { reportId, status };
  },
});
