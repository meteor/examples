import { Meteor } from 'meteor/meteor';
import { IssueReports } from './collection';

const DEMO_OWNER_ID = 'demo-civic-owner';

Meteor.startup(async () => {
  const now = new Date();
  const fixtures = [
    {
      category: 'Pothole',
      title: 'Pothole near transit stop',
      description: 'Large pothole in the bus lane beside the morning pickup point.',
      status: 'submitted',
      location: { latitude: 40.4168, longitude: -3.7038, accuracy: 20 },
      photoDataUrl: '/images/neighborhood-field.jpg',
    },
    {
      category: 'Graffiti',
      title: 'Graffiti on library shutters',
      description: 'New paint covers the lower shutters along the children’s entrance.',
      status: 'in review',
      location: { latitude: 40.4174, longitude: -3.7045, accuracy: 18 },
    },
    {
      category: 'Streetlight',
      title: 'Crosswalk light restored',
      description: 'The crossing is lit again after an evening safety report.',
      status: 'fixed',
      location: { latitude: 40.4159, longitude: -3.7029, accuracy: 22 },
    },
    {
      category: 'Blocked lane',
      title: 'Delivery crates in cycle lane',
      description: 'Draft saved while checking whether the obstruction is temporary.',
      status: 'draft',
      location: { latitude: 40.4162, longitude: -3.7051, accuracy: 16 },
    },
  ];

  for (const [index, fixture] of fixtures.entries()) {
    const updatedAt = new Date(now.getTime() - index * 60_000);
    await IssueReports.updateAsync(
      { ownerId: DEMO_OWNER_ID, title: fixture.title },
      {
        $set: {
          ...fixture,
          updatedAt,
          ...(fixture.status === 'draft' ? {} : { submittedAt: updatedAt }),
        },
        $setOnInsert: { ownerId: DEMO_OWNER_ID, createdAt: updatedAt },
      },
      { upsert: true }
    );
  }
});
