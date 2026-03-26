import {Tracker} from 'meteor/tracker';
import {writable} from 'svelte/store';

/**
 * Creates a Svelte store that reactively tracks a Meteor computation.
 * Replaces the rdb:svelte-meteor-data package for Meteor 3.
 *
 * @param {function} reactiveFn - A function that uses reactive Meteor data sources
 * @returns {import('svelte/store').Readable} A Svelte readable store
 */
export function useTracker(reactiveFn)
{
  const store = writable(reactiveFn(), (set) =>
  {
    const computation = Tracker.autorun(() =>
    {
      set(reactiveFn());
    });

    return () =>
    {
      computation.stop();
    };
  });

  return store;
}
