import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDP } from 'meteor/ddp';
import { Boards } from './collection';
import { Cards } from '../cards/collection';
import { cleanTitle } from '../cards/titles';

const DEFAULT_COLUMNS = ['To do', 'Doing', 'Done'];

// Drawn from the Method's seeded stream, as a collection draws an `_id`: the
// stub and the server get the same id, where `Random.id()` gives them two.
const newColumnId = () => DDP.randomStream('columns').id();

const requireTitle = (title) => {
  check(title, String);
  const cleaned = cleanTitle(title);
  if (!cleaned) throw new Meteor.Error('empty-title', 'A title is required');
  return cleaned;
};

Meteor.methods({
  async 'boards.create'(title) {
    return Boards.insertAsync({
      title: requireTitle(title),
      columns: DEFAULT_COLUMNS.map((columnTitle) => ({ _id: newColumnId(), title: columnTitle })),
      createdAt: new Date(),
    });
  },

  async 'boards.addColumn'(boardId, title) {
    check(boardId, String);
    const column = { _id: newColumnId(), title: requireTitle(title) };
    // A Method sent again after a reconnect draws the same id, and still
    // carries the first title if the column was renamed since: the id alone
    // tells whether the board already has it.
    const updated = await Boards.updateAsync(
      { _id: boardId, 'columns._id': { $ne: column._id } },
      { $push: { columns: column } },
    );
    if (!updated && !(await Boards.findOneAsync(boardId))) {
      throw new Meteor.Error('board-not-found', 'No such board');
    }
    return column._id;
  },

  async 'boards.renameColumn'(boardId, columnId, title) {
    check([boardId, columnId], [String]);
    return Boards.updateAsync(
      { _id: boardId, 'columns._id': columnId },
      { $set: { 'columns.$.title': requireTitle(title) } },
    );
  },

  async 'boards.removeColumn'(boardId, columnId) {
    check([boardId, columnId], [String]);
    await Boards.updateAsync(boardId, { $pull: { columns: { _id: columnId } } });
    return Cards.removeAsync({ boardId, columnId });
  },
});

if (Meteor.isServer) {
  Meteor.methods({
    // Called from a template helper on the landing page: no stub, so the
    // helper's Promise only settles with the server's answer.
    async 'boards.stats'() {
      return {
        boards: await Boards.find().countAsync(),
        cards: await Cards.find().countAsync(),
      };
    },
  });
}
