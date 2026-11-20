import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Layouts, PANELS, panelsIn } from '/imports/admin/layout';

const save = (panels) => Meteor.server.method_handlers['admin.saveLayout'].apply({ userId: null }, [panels]);
const defaults = PANELS.map(({ id, x, y, w, h }) => ({ id, x, y, w, h }));

describe('dashboard layout', function () {
  beforeEach(async function () {
    await Layouts.removeAsync({});
  });

  it('saves where the panels are, and leaves their titles and templates in the code', async function () {
    await save([{ id: 'chart', x: 4, y: 2, w: 8, h: 4 }, { id: 'instances', x: 0, y: 2, w: 4, h: 4 }]);
    const panels = panelsIn(await Layouts.findOneAsync('admin'));
    const chart = panels.find((panel) => panel.id === 'chart');
    assert.deepStrictEqual([chart.x, chart.title, chart.template], [4, 'Calls per minute', 'adminChart']);
    assert.strictEqual(panels.find((panel) => panel.id === 'tiles').w, 12);
  });

  it('refuses unknown panels, extra fields and positions outside the grid', async function () {
    await assert.rejects(save([{ id: 'secret', x: 0, y: 0, w: 4, h: 4 }]), { errorType: 'Match.Error' });
    await assert.rejects(save([{ id: 'chart', x: 0, y: 0, w: 4, h: 4, template: 'other' }]), { errorType: 'Match.Error' });
    await assert.rejects(save([{ id: 'chart', x: 10, y: 0, w: 4, h: 4 }]), { errorType: 'Match.Error' });
    await assert.rejects(save([{ id: 'chart', x: 0, y: 0, w: 0, h: 4 }]), { errorType: 'Match.Error' });
    // Smaller than the panel allows, or the same panel twice.
    await assert.rejects(save([{ id: 'chart', x: 0, y: 0, w: 1, h: 1 }]), { errorType: 'Match.Error' });
    await assert.rejects(save([{ id: 'chart', x: 0, y: 0, w: 8, h: 4 }, { id: 'chart', x: 0, y: 4, w: 8, h: 4 }]), { errorType: 'Match.Error' });
    assert.strictEqual(await Layouts.findOneAsync('admin'), undefined);
  });

  it('goes back to the default layout on reset', async function () {
    await save(defaults.map((panel) => ({ ...panel, y: panel.y + 1 })));
    await Meteor.server.method_handlers['admin.resetLayout'].apply({ userId: null }, []);
    assert.deepStrictEqual(panelsIn(await Layouts.findOneAsync('admin')).map(({ id, x, y, w, h }) => ({ id, x, y, w, h })), defaults);
  });
});
