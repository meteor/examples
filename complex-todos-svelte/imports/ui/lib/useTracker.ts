import {Tracker} from 'meteor/tracker';
import {readable, type Readable} from 'svelte/store';

/** Bridge reactive Meteor data into a Svelte store, stopping when it has no subscribers. */
export function useTracker<T>(reactiveFn: () => T): Readable<T>
{
  return readable(reactiveFn(), (set) =>
  {
    const computation = Tracker.autorun(() => set(reactiveFn()));
    return () => computation.stop();
  });
}
