import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Boards } from '../boards/collection';
import { Cards } from './collection';
import { rankBetween, needsRenumbering } from './ranks';
import { cleanTitle } from './titles';

const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_PASTED_CARDS = 100;

const requireColumn = async (boardId, columnId) => {
  const board = await Boards.findOneAsync({ _id: boardId, 'columns.id': columnId });
  if (!board) throw new Meteor.Error('column-not-found', 'No such column on this board');
};

const requireCard = async (cardId) => {
  const card = await Cards.findOneAsync(cardId);
  if (!card) throw new Meteor.Error('card-not-found', 'No such card');
  return card;
};

const appendCard = async (boardId, columnId, title) => {
  const last = await Cards.findOneAsync({ boardId, columnId }, { sort: { rank: -1 } });
  const now = new Date();
  return Cards.insertAsync({
    boardId,
    columnId,
    title,
    description: '',
    rank: rankBetween(last?.rank, undefined),
    createdAt: now,
    updatedAt: now,
  });
};

Meteor.methods({
  async 'cards.insert'(boardId, columnId, title) {
    check([boardId, columnId, title], [String]);
    const cleaned = cleanTitle(title);
    if (!cleaned) throw new Meteor.Error('empty-title', 'A card needs a title');
    await requireColumn(boardId, columnId);
    return appendCard(boardId, columnId, cleaned);
  },

  async 'cards.insertMany'(boardId, columnId, titles) {
    check([boardId, columnId], [String]);
    check(titles, [String]);
    const cleaned = titles.map(cleanTitle).filter(Boolean);
    if (!cleaned.length) throw new Meteor.Error('empty-title', 'No card titles in the pasted text');
    if (cleaned.length > MAX_PASTED_CARDS) {
      throw new Meteor.Error('too-many-cards', `At most ${MAX_PASTED_CARDS} cards at once`);
    }
    await requireColumn(boardId, columnId);
    const ids = [];
    for (const title of cleaned) ids.push(await appendCard(boardId, columnId, title));
    return ids;
  },

  async 'cards.update'(cardId, fields) {
    check(cardId, String);
    check(fields, { title: String, description: String });
    const title = cleanTitle(fields.title);
    if (!title) throw new Meteor.Error('empty-title', 'A card needs a title');
    const description = fields.description.trim().slice(0, MAX_DESCRIPTION_LENGTH);
    await requireCard(cardId);
    return Cards.updateAsync(cardId, { $set: { title, description, updatedAt: new Date() } });
  },

  // Moves a card to `columnId`, before the card `beforeCardId` or at the end
  // of the column when it is null. Runs as a stub on the client too, so the
  // board updates before the server answers.
  async 'cards.move'(cardId, columnId, beforeCardId) {
    check([cardId, columnId], [String]);
    check(beforeCardId, Match.Maybe(String));
    const card = await requireCard(cardId);
    await requireColumn(card.boardId, columnId);

    const siblings = await Cards.find(
      { boardId: card.boardId, columnId, _id: { $ne: cardId } },
      { sort: { rank: 1 } },
    ).fetchAsync();
    // A target card that left the column meanwhile sends the card to the end.
    const foundIndex = beforeCardId ? siblings.findIndex((sibling) => sibling._id === beforeCardId) : -1;
    const index = foundIndex === -1 ? siblings.length : foundIndex;

    if (needsRenumbering(siblings[index - 1]?.rank, siblings[index]?.rank)) {
      await Promise.all(siblings.map((sibling, rank) => {
        sibling.rank = rank;
        return Cards.updateAsync(sibling._id, { $set: { rank } });
      }));
    }
    const rank = rankBetween(siblings[index - 1]?.rank, siblings[index]?.rank);
    return Cards.updateAsync(cardId, { $set: { columnId, rank, updatedAt: new Date() } });
  },

  async 'cards.remove'(cardId) {
    check(cardId, String);
    return Cards.removeAsync(cardId);
  },
});
