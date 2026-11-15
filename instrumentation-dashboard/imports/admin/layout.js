import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { requireAdmin } from './authorization';

// Where the dashboard's panels sit, in a 12-column grid. One document, 'admin',
// shared by everyone who opens the dashboard: move a panel and the other open
// dashboards follow. With accounts, key it by user instead.
export const Layouts = new Mongo.Collection('admin_layouts');

export const COLUMNS = 12;
export const PANELS = [
  { id: 'tiles', title: 'Overview', template: 'adminTiles', x: 0, y: 0, w: 12, h: 2, minW: 3, minH: 2 },
  { id: 'chart', title: 'Calls per minute', template: 'adminChart', x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
  { id: 'instances', title: 'Servers', template: 'adminInstances', x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 2 },
  { id: 'methods', title: 'Methods', template: 'adminMethods', x: 0, y: 6, w: 6, h: 5, minW: 4, minH: 3 },
  { id: 'events', title: 'Recent events', template: 'adminEvents', x: 6, y: 6, w: 6, h: 5, minW: 4, minH: 3 },
];

// The panels, where the saved layout puts them.
export function panelsIn(layout) {
  const saved = new Map((layout?.panels ?? []).map((panel) => [panel.id, panel]));
  return PANELS.map((panel) => ({ ...panel, ...saved.get(panel.id) }));
}

const Cell = (max) => Match.Where((value) => Number.isInteger(value) && value >= 0 && value <= max);
const Position = Match.Where((panel) => {
  check(panel, { id: Match.Where((id) => PANELS.some((known) => known.id === id)), x: Cell(COLUMNS - 1), y: Cell(1000), w: Cell(COLUMNS), h: Cell(100) });
  const { minW, minH } = PANELS.find((known) => known.id === panel.id);
  return panel.w >= minW && panel.h >= minH && panel.x + panel.w <= COLUMNS;
});
// Each panel at most once.
const Positions = Match.Where((panels) => {
  check(panels, [Position]);
  return panels.length <= PANELS.length && new Set(panels.map((panel) => panel.id)).size === panels.length;
});

// Loaded on both sides: the stub keeps this dashboard's copy in step with its
// grid at once, the server saves the layout for everyone.
Meteor.methods({
  async 'admin.saveLayout'(panels) {
    check(panels, Positions);
    if (!(await requireAdmin(this.userId))) throw new Meteor.Error('not-authorized');
    await Layouts.upsertAsync('admin', { $set: { panels } });
  },
  async 'admin.resetLayout'() {
    if (!(await requireAdmin(this.userId))) throw new Meteor.Error('not-authorized');
    await Layouts.removeAsync('admin');
  },
});
