import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Boards } from '/imports/api/boards/collection';
import { Cards } from '/imports/api/cards/collection';

const titlesIn = async (boardId, columnId) =>
  (await Cards.find({ boardId, columnId }, { sort: { rank: 1 } }).fetchAsync()).map((card) => card.title);

const ranksIn = async (boardId, columnId) =>
  (await Cards.find({ boardId, columnId }, { sort: { rank: 1 } }).fetchAsync()).map((card) => card.rank);

describe('board methods', function () {
  let boardId;
  let board;

  beforeEach(async function () {
    await Boards.removeAsync({});
    await Cards.removeAsync({});
    boardId = await Meteor.callAsync('boards.create', '  Sprint 12 ');
    board = await Boards.findOneAsync(boardId);
  });

  it('creates a board with three columns and a trimmed title', function () {
    assert.strictEqual(board.title, 'Sprint 12');
    assert.deepStrictEqual(board.columns.map((column) => column.title), ['To do', 'Doing', 'Done']);
  });

  it('refuses an empty title', async function () {
    await assert.rejects(Meteor.callAsync('boards.create', '   '), { error: 'empty-title' });
  });

  it('gives every column an id of its own', async function () {
    const columnId = await Meteor.callAsync('boards.addColumn', boardId, 'Blocked');
    const ids = (await Boards.findOneAsync(boardId)).columns.map((column) => column._id);
    assert.strictEqual(new Set(ids).size, 4);
    assert.strictEqual(ids.at(-1), columnId);
  });

  it('adds, renames and removes a column with its cards', async function () {
    const columnId = await Meteor.callAsync('boards.addColumn', boardId, 'Blocked');
    await Meteor.callAsync('cards.insert', boardId, columnId, 'Waiting on legal');
    await Meteor.callAsync('cards.insert', boardId, board.columns[0]._id, 'Stays');
    await Meteor.callAsync('boards.renameColumn', boardId, columnId, 'On hold');
    assert.strictEqual((await Boards.findOneAsync(boardId)).columns.at(-1).title, 'On hold');

    await Meteor.callAsync('boards.removeColumn', boardId, columnId);
    assert.strictEqual((await Boards.findOneAsync(boardId)).columns.length, 3);
    assert.deepStrictEqual(await titlesIn(boardId, board.columns[0]._id), ['Stays']);
    assert.strictEqual(await Cards.find({ boardId }).countAsync(), 1);
  });

  it('counts boards and cards', async function () {
    await Meteor.callAsync('cards.insertMany', boardId, board.columns[0]._id, ['One', 'Two']);
    assert.deepStrictEqual(await Meteor.callAsync('boards.stats'), { boards: 1, cards: 2 });
  });
});

describe('card methods', function () {
  let boardId;
  let todo;
  let doing;

  beforeEach(async function () {
    await Boards.removeAsync({});
    await Cards.removeAsync({});
    boardId = await Meteor.callAsync('boards.create', 'Sprint');
    [todo, doing] = (await Boards.findOneAsync(boardId)).columns.map((column) => column._id);
  });

  it('appends cards in insertion order', async function () {
    await Meteor.callAsync('cards.insert', boardId, todo, 'A');
    await Meteor.callAsync('cards.insert', boardId, todo, 'B');
    await Meteor.callAsync('cards.insertMany', boardId, todo, ['C', '', 'D']);
    assert.deepStrictEqual(await titlesIn(boardId, todo), ['A', 'B', 'C', 'D']);
    assert.deepStrictEqual(await ranksIn(boardId, todo), [0, 1, 2, 3]);
  });

  it('refuses more than 100 cards at once', async function () {
    const titles = Array.from({ length: 101 }, (unused, index) => `Card ${index}`);
    await assert.rejects(Meteor.callAsync('cards.insertMany', boardId, todo, titles), { error: 'too-many-cards' });
    assert.strictEqual(await Cards.find({ boardId }).countAsync(), 0);
  });

  it('rejects a card for a column of another board', async function () {
    const otherBoardId = await Meteor.callAsync('boards.create', 'Other');
    await assert.rejects(Meteor.callAsync('cards.insert', otherBoardId, todo, 'A'), { error: 'column-not-found' });
  });

  it('moves a card before another one, or to the end of a column', async function () {
    const [a, b, c] = await Meteor.callAsync('cards.insertMany', boardId, todo, ['A', 'B', 'C']);
    await Meteor.callAsync('cards.move', c, todo, a);
    assert.deepStrictEqual(await titlesIn(boardId, todo), ['C', 'A', 'B']);

    await Meteor.callAsync('cards.move', a, doing, null);
    await Meteor.callAsync('cards.move', b, doing, null);
    assert.deepStrictEqual(await titlesIn(boardId, todo), ['C']);
    assert.deepStrictEqual(await titlesIn(boardId, doing), ['A', 'B']);

    // The target card left the column meanwhile: the move lands at the end.
    await Meteor.callAsync('cards.move', c, doing, 'gone');
    assert.deepStrictEqual(await titlesIn(boardId, doing), ['A', 'B', 'C']);
  });

  it('refuses to move a card to a column of another board', async function () {
    const [a] = await Meteor.callAsync('cards.insertMany', boardId, todo, ['A']);
    const otherBoardId = await Meteor.callAsync('boards.create', 'Other');
    const otherColumnId = (await Boards.findOneAsync(otherBoardId)).columns[0]._id;
    await assert.rejects(Meteor.callAsync('cards.move', a, otherColumnId, null), { error: 'column-not-found' });
    assert.strictEqual((await Cards.findOneAsync(a)).columnId, todo);
  });

  it('renumbers a column when the gaps get too small', async function () {
    const [a, b, c] = await Meteor.callAsync('cards.insertMany', boardId, todo, ['A', 'B', 'C']);
    for (let round = 0; round < 40; round += 1) {
      await Meteor.callAsync('cards.move', round % 2 ? b : c, todo, round % 2 ? c : b);
    }
    const ranks = await ranksIn(boardId, todo);
    assert.deepStrictEqual(await titlesIn(boardId, todo), ['A', 'B', 'C']);
    // Without renumbering one of the gaps would be 2^-40 by now.
    assert.ok(ranks[1] - ranks[0] >= 5e-7 && ranks[2] - ranks[1] >= 5e-7, `ranks too close: ${ranks}`);
    assert.strictEqual((await Cards.findOneAsync(a)).rank, 0);
  });

  it('updates a card and refuses an empty title', async function () {
    const [a] = await Meteor.callAsync('cards.insertMany', boardId, todo, ['A']);
    await Meteor.callAsync('cards.update', a, { title: ' A2 ', description: ' Details ' });
    const card = await Cards.findOneAsync(a);
    assert.strictEqual(card.title, 'A2');
    assert.strictEqual(card.description, 'Details');
    await assert.rejects(Meteor.callAsync('cards.update', a, { title: '', description: '' }), { error: 'empty-title' });
  });

  it('removes a card', async function () {
    const [a] = await Meteor.callAsync('cards.insertMany', boardId, todo, ['A', 'B']);
    await Meteor.callAsync('cards.remove', a);
    assert.deepStrictEqual(await titlesIn(boardId, todo), ['B']);
  });
});
