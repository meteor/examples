import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Boards } from '/imports/api/boards/collection';
import { Cards } from '/imports/api/cards/collection';
import { splitTitles } from '/imports/api/cards/titles';

import './board.html';
import './board-chart';

// One board is open at a time, so the page state lives in the module.
const editingCardId = new ReactiveVar(new URLSearchParams(location.hash.slice(1)).get('card'));
const dropTargetColumnId = new ReactiveVar(null);
const notice = new ReactiveVar(null);

const notify = (text) => notice.set({ text, at: Date.now() });
const reportError = (error) => notify(error.reason ?? error.message);

const cardsIn = (board, column) => Cards.find({ boardId: board._id, columnId: column.id }, { sort: { rank: 1 } });

// The card under the pointer, or the next one when the pointer is in its
// lower half; null drops at the end of the column.
const cardBefore = (event) => {
  const over = event.target.closest('.card');
  if (!over) return null;
  const { top, height } = over.getBoundingClientRect();
  const target = event.clientY < top + height / 2 ? over : over.nextElementSibling;
  return target?.dataset.cardId ?? null;
};

// The method stub moves the card in Minimongo right away. Starting the call
// inside the view transition callback and flushing there lets the browser
// snapshot the board before and after the move, and animate between the two.
const moveCard = async (cardId, columnId, beforeCardId) => {
  let call;
  const applyMove = async () => {
    call = Meteor.callAsync('cards.move', cardId, columnId, beforeCardId);
    await call.stubPromise;
    Tracker.flush();
  };
  try {
    if (document.startViewTransition) {
      await document.startViewTransition(applyMove).updateCallbackDone;
    } else {
      await applyMove();
    }
    await call;
  } catch (error) {
    reportError(error);
  }
};

Template.boardPage.onCreated(function () {
  this.autorun(() => this.subscribe('board', Template.currentData().boardId));
});

Template.boardPage.onRendered(function () {
  let hideTimer;
  this.autorun(() => {
    if (!notice.get()) return;
    const toast = this.find('.toast');
    if (!toast.matches(':popover-open')) toast.showPopover();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toast.hidePopover(), 2500);
  });
});

Template.boardPage.helpers({
  currentBoard: () => Boards.findOne(Template.currentData().boardId),
  ready: () => Template.instance().subscriptionsReady(),
  canShare: () => typeof navigator.share === 'function',
  editingCard: () => editingCardId.get() && Cards.findOne(editingCardId.get()),
  notice: () => notice.get()?.text,
});

Template.boardPage.events({
  async 'click .share'() {
    const board = Boards.findOne(this.boardId);
    try {
      await navigator.share({ title: board.title, url: location.href });
    } catch (error) {
      if (error.name !== 'AbortError') reportError(error);
    }
  },

  'click .copy-link'() {
    navigator.clipboard.writeText(location.href).then(() => notify('Board link copied'), reportError);
  },

  async 'submit .new-column'(event) {
    event.preventDefault();
    const input = event.currentTarget.elements.title;
    const title = input.value;
    input.value = '';
    try {
      await Meteor.callAsync('boards.addColumn', this.boardId, title);
    } catch (error) {
      input.value = title;
      reportError(error);
    }
  },
});

// The custom element takes an array through its `data` property; an attribute
// would only carry a string. The element exists once the template is rendered,
// and the autorun re-runs whenever a card is added, moved or removed.
Template.boardChart.onRendered(function () {
  this.autorun(() => {
    const { board } = Template.currentData();
    this.find('board-chart').data = board.columns.map((column) => ({
      title: column.title,
      count: cardsIn(board, column).count(),
    }));
  });
});

Template.boardChart.helpers({
  summary() {
    return this.board.columns.map((column) => `${column.title}: ${cardsIn(this.board, column).count()}`).join(', ');
  },
});

Template.boardColumn.onCreated(function () {
  this.renaming = new ReactiveVar(false);
});

Template.boardColumn.helpers({
  cards() {
    return cardsIn(this.board, this.column);
  },
  cardCount() {
    return cardsIn(this.board, this.column).count();
  },
  menuId() {
    return `menu-${this.column.id}`;
  },
  renaming: () => Template.instance().renaming.get(),
  isDropTarget() {
    return dropTargetColumnId.get() === this.column.id;
  },
});

Template.boardColumn.events({
  'click .start-rename'(event, instance) {
    instance.find('.menu').hidePopover();
    instance.renaming.set(true);
    // The input only exists after the next flush: focus it then.
    Tracker.afterFlush(() => instance.find('.rename-column input')?.focus());
  },

  'keydown .rename-column input'(event, instance) {
    if (event.key === 'Escape') instance.renaming.set(false);
  },

  async 'submit .rename-column'(event, instance) {
    event.preventDefault();
    try {
      await Meteor.callAsync('boards.renameColumn', this.board._id, this.column.id, event.currentTarget.elements.title.value);
      instance.renaming.set(false);
    } catch (error) {
      reportError(error);
    }
  },

  'click .remove-column'(event, instance) {
    instance.find('.menu').hidePopover();
    Meteor.callAsync('boards.removeColumn', this.board._id, this.column.id).catch(reportError);
  },

  // The stub shows the card at once, so the input is cleared at once too;
  // clearing it after the server answered could wipe what was typed meanwhile.
  async 'submit .new-card'(event) {
    event.preventDefault();
    const input = event.currentTarget.elements.title;
    const title = input.value;
    input.value = '';
    try {
      await Meteor.callAsync('cards.insert', this.board._id, this.column.id, title);
    } catch (error) {
      input.value = title;
      reportError(error);
    }
  },

  // Pasting several lines creates one card per line. `clipboardData` sits on
  // the event itself: there is no jQuery wrapper and no `originalEvent`.
  'paste .new-card input'(event) {
    const titles = splitTitles(event.clipboardData.getData('text/plain'));
    if (titles.length < 2) return;
    event.preventDefault();
    Meteor.callAsync('cards.insertMany', this.board._id, this.column.id, titles).catch(reportError);
  },

  'dragover .column'(event) {
    event.preventDefault(); // allows the drop
    event.dataTransfer.dropEffect = 'move';
    dropTargetColumnId.set(this.column.id);
  },

  'dragleave .column'(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) dropTargetColumnId.set(null);
  },

  'drop .column'(event) {
    event.preventDefault();
    dropTargetColumnId.set(null);
    const cardId = event.dataTransfer.getData('text/plain');
    const beforeCardId = cardBefore(event);
    if (!cardId || beforeCardId === cardId) return;
    moveCard(cardId, this.column.id, beforeCardId);
  },
});

const openCard = (cardId) => {
  editingCardId.set(cardId);
  history.replaceState(null, '', `#card=${cardId}`);
};

Template.boardCard.events({
  'dragstart .card'(event) {
    event.dataTransfer.setData('text/plain', this.card._id);
    event.dataTransfer.effectAllowed = 'move';
  },

  'dragend .card'() {
    dropTargetColumnId.set(null);
  },

  'click .card'() {
    openCard(this.card._id);
  },

  'keydown .card'(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCard(this.card._id);
    }
  },
});

Template.cardEditor.onCreated(function () {
  this.status = new ReactiveVar('');
});

Template.cardEditor.onRendered(function () {
  this.find('dialog').showModal();
});

Template.cardEditor.helpers({
  status: () => Template.instance().status.get(),
});

Template.cardEditor.events({
  // With `method="dialog"` a submit closes the dialog and `event.submitter`
  // tells which button did it. Saving keeps it open until the server answers.
  async 'submit form'(event, instance) {
    if (event.submitter.value !== 'save') return;
    event.preventDefault();
    const { elements } = event.currentTarget;
    instance.status.set('Saving…');
    try {
      await Meteor.callAsync('cards.update', this.card._id, {
        title: elements.title.value,
        description: elements.description.value,
      });
      // `instance` came in as an argument: `Template.instance()` would be
      // null here, after the `await`.
      instance.find('dialog').close('saved');
    } catch (error) {
      instance.status.set(error.reason ?? error.message);
    }
  },

  async 'click .copy-card-link'(event, instance) {
    const url = `${location.origin}/b/${this.card.boardId}#card=${this.card._id}`;
    try {
      await navigator.clipboard.writeText(url);
      instance.status.set('Link copied');
    } catch (error) {
      instance.status.set(error.message);
    }
  },

  'click .remove-card'(event, instance) {
    instance.find('dialog').close('removed');
    Meteor.callAsync('cards.remove', this.card._id).catch(reportError);
  },

  // `close` does not bubble; Blaze listens to it in the capture phase, so the
  // event map sees it whether Escape, Cancel, a click outside or a save
  // closed the dialog.
  'close dialog'() {
    editingCardId.set(null);
    history.replaceState(null, '', location.pathname);
  },
});
