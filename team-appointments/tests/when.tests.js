import assert from 'assert';
import { when } from '/imports/api/appointments';

// npm test runs in America/Los_Angeles: west of UTC, a UTC midnight is the day
// before in local time, which is what these tests would catch.
describe('when', function () {
  it('shows a whole-day appointment on its own day, whatever the time zone', function () {
    const start = new Date(Date.UTC(2026, 10, 20));
    const end = new Date(Date.UTC(2026, 10, 21));
    assert.strictEqual(when({ start, end, allDay: true }, 'en-GB'), '20 Nov 2026');
  });

  it('shows the last day of a whole-day appointment, not the day after', function () {
    const start = new Date(Date.UTC(2026, 10, 20));
    const end = new Date(Date.UTC(2026, 10, 23));
    // ICU versions differ on the spaces around the dash.
    assert.match(when({ start, end, allDay: true }, 'en-GB'), /^20\s?–\s?22 Nov 2026$/);
  });
});
