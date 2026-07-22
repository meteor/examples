import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { IssueReports } from '../imports/api/reports/collection';
import '../imports/api/reports/methods';

if (Meteor.isServer) {
  describe('report methods', function () {
    beforeEach(async function () {
      await IssueReports.removeAsync({});
    });

    it('creates draft report', async function () {
      const ownerId = Random.id();
      const { reportId } = await Meteor.callAsync('reports.createDraft', {
        ownerId,
        category: 'Pothole',
      });

      const report = await IssueReports.findOneAsync(reportId);
      assert.strictEqual(report.ownerId, ownerId);
      assert.strictEqual(report.category, 'Pothole');
      assert.strictEqual(report.status, 'draft');
    });

    it('updates draft location and description', async function () {
      const ownerId = Random.id();
      const { reportId } = await Meteor.callAsync('reports.createDraft', {
        ownerId,
        category: 'Streetlight',
      });

      await Meteor.callAsync('reports.updateDraft', {
        ownerId,
        reportId,
        patch: {
          title: 'Light out on 4th',
          description: 'Lamp is dark after sunset',
          location: { latitude: 40.4168, longitude: -3.7038, accuracy: 12 },
        },
      });

      const report = await IssueReports.findOneAsync(reportId);
      assert.strictEqual(report.title, 'Light out on 4th');
      assert.strictEqual(report.location.latitude, 40.4168);
    });

    it('submits own draft only', async function () {
      const ownerId = Random.id();
      const otherOwnerId = Random.id();
      const { reportId } = await Meteor.callAsync('reports.createDraft', {
        ownerId,
        category: 'Sidewalk',
      });

      await assert.rejects(
        () => Meteor.callAsync('reports.submit', { ownerId: otherOwnerId, reportId }),
        (err) => err.error === 'not-found'
      );

      const result = await Meteor.callAsync('reports.submit', { ownerId, reportId });
      assert.strictEqual(result.status, 'submitted');
    });
  });
}
