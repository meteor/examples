import { Meteor } from 'meteor/meteor';

const nativeSettings = (Meteor.settings && Meteor.settings.public && Meteor.settings.public.native) || {};

export const APPLE_ITUNES_APP_ID = nativeSettings.appleItunesAppId || '';
export const APPLE_TEAM_ID = nativeSettings.appleTeamId || '';
export const APPLE_BUNDLE_ID = nativeSettings.appleBundleId || '';
export const GOOGLE_PLAY_APP_ID = nativeSettings.googlePlayAppId || '';

export const getGooglePlayAppUrl = ({ googlePlayAppId }) => {
  if (!googlePlayAppId) return null;
  return `https://play.google.com/store/apps/details?id=${googlePlayAppId}`;
};

export const getAppleItunesAppUrl = ({ appleItunesAppId }) => {
  if (!appleItunesAppId) return null;
  return `https://itunes.apple.com/app/id${appleItunesAppId}`;
};

export const getNativeStoresInfo = () => ({
  appleItunesAppId: APPLE_ITUNES_APP_ID,
  googlePlayAppId: GOOGLE_PLAY_APP_ID,
  appleTeamId: APPLE_TEAM_ID,
  appleBundleId: APPLE_BUNDLE_ID,
  nativeAppEnabled: !!(APPLE_ITUNES_APP_ID || GOOGLE_PLAY_APP_ID),
});
