import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './app.html';
import './landing';
import './board';

// Two pages chosen by the path, `/` and `/b/<boardId>`, through `history` and
// a reactive copy of the path. No router package.
const path = new ReactiveVar(location.pathname);
window.addEventListener('popstate', () => path.set(location.pathname));

export const navigate = (to) => {
  history.pushState(null, '', to);
  path.set(location.pathname);
};

Template.app.helpers({
  boardId: () => path.get().match(/^\/b\/([A-Za-z0-9]+)$/)?.[1],
});
