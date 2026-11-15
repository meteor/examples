import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Presence } from 'meteor/dupontbertrand:presence';
import { Appointments, when } from '/imports/api/appointments';
import { canChange } from '/imports/api/permissions';
import { room, editing, edit, showError } from './state';

import './editor.html';

Template.appointmentEditor.onCreated(function () {
  // The appointment as it was when opened: the form edits that version, and the
  // server refuses the save if someone changed it in between.
  this.opened = new ReactiveVar(null);
  this.error = new ReactiveVar('');
  this.confirming = new ReactiveVar(false);
  // Our own save also brings a new revision: that one is not someone else's.
  this.saving = new ReactiveVar(false);
  this.autorun(() => {
    const id = editing.get();
    if (!id) return this.opened.set(null);
    this.subscribe('appointments.one', id);
    // The list page only has the table's columns, and a new appointment has no
    // revision until the server saved it: wait for the whole document.
    const appointment = Appointments.findOne(id);
    if (typeof appointment?.revision === 'string' && Tracker.nonreactive(() => this.opened.get()?._id) !== id) {
      this.opened.set(appointment);
      Tracker.afterFlush(() => this.find('input[name=title]')?.focus());
    }
  });
});

Template.appointmentEditor.onRendered(function () {
  const dialog = this.find('dialog');
  this.autorun(() => {
    if (editing.get() && !dialog.open) dialog.showModal();
    else if (!editing.get() && dialog.open) dialog.close();
  });
});

const current = (opened) => Appointments.findOne(opened._id);

Template.appointmentEditor.helpers({
  opened: () => Template.instance().opened.get(),
  when() {
    return when(this, navigator.language);
  },
  owner() {
    const user = Meteor.users.findOne(this.ownerId);
    return user && { name: user.profile?.name ?? user.username, color: user.profile?.color };
  },
  canEdit() {
    return canChange(Meteor.userId(), this);
  },
  readOnly() {
    return !canChange(Meteor.userId(), this);
  },
  alsoOpen() {
    return Presence.members(room()).filter((member) => member.state?.editing === this._id);
  },
  gone() {
    return !current(this);
  },
  changedSince() {
    const now = current(this);
    return !Template.instance().saving.get() && Boolean(now) && now.revision !== this.revision;
  },
  error: () => Template.instance().error.get(),
  confirming: () => Template.instance().confirming.get(),
});

Template.appointmentEditor.events({
  async 'submit .editor-form'(event, instance) {
    event.preventDefault();
    const { _id, revision } = instance.opened.get();
    const { title, client, notes } = event.currentTarget.elements;
    instance.saving.set(true);
    try {
      await Meteor.callAsync('appointments.update', _id, revision, { title: title.value, client: client.value, notes: notes.value });
      edit(null);
    } catch (error) {
      instance.error.set(error.reason ?? error.message);
    } finally {
      instance.saving.set(false);
    }
  },
  // The stub deletes it at once: close then, and report a refusal on the page.
  'click .delete'(event, instance) {
    if (!instance.confirming.get()) return instance.confirming.set(true);
    const call = Meteor.callAsync('appointments.remove', instance.opened.get()._id);
    call.catch(showError);
    call.stubPromise.then(() => edit(null), () => {});
  },
  'click .reload'(event, instance) {
    instance.opened.set(current(instance.opened.get()));
    instance.error.set('');
  },
  'click .close'() {
    edit(null);
  },
  // Escape, a click outside, or edit(null): the dialog is closed either way.
  'close dialog'(event, instance) {
    if (editing.get()) edit(null);
    instance.error.set('');
    instance.confirming.set(false);
  },
});
