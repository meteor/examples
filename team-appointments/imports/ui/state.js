import { ReactiveVar } from 'meteor/reactive-var';
import { Presence } from 'meteor/dupontbertrand:presence';
import { roomOf } from '/imports/api/team';

// The page, from the address: #calendar (the default) or #list. No router package.
const pageFromHash = () => (location.hash === '#list' ? 'list' : 'calendar');
export const page = new ReactiveVar(pageFromHash());
window.addEventListener('hashchange', () => page.set(pageFromHash()));
export const room = () => roomOf(page.get());

// The appointment open in the editor, if any. The others on the page see it: the
// editor's state travels with presence, next to the pointer, in the room of the
// page it was opened on.
export const editing = new ReactiveVar(null);
let editingIn = null;
export function edit(id) {
  if (editingIn) Presence.update(editingIn, { editing: null });
  editingIn = id ? room() : null;
  if (id) Presence.update(editingIn, { editing: id });
  editing.set(id);
}

// One line at the top for what the server refused.
export const notice = new ReactiveVar('');
export const showError = (error) => notice.set(error?.reason ?? error?.message ?? String(error));
