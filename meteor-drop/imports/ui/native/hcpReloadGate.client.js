import { Meteor } from 'meteor/meteor';
import { Reload } from 'meteor/reload';
import { hcpReloadConsent, listenForHcpUpdates } from './hcp';

if (Meteor.isCapacitor) {
  hcpReloadConsent.install(Reload);
  listenForHcpUpdates(() => {});
}
