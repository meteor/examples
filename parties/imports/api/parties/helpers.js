import { check, Match } from 'meteor/check';
import _ from 'lodash';

export const attending = function (party) {
  return (_.groupBy(party.rsvps, 'rsvp').yes || []).length;
};

export const NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length !== 0;
});

export const Coordinate = Match.Where(function (x) {
  check(x, Number);
  return x >= 0 && x <= 1;
});

export const displayName = function (user) {
  if (user.profile?.name)
    return user.profile.name;
  return user.emails[0].address;
};

export const contactEmail = function (user) {
  if (user.emails?.length)
    return user.emails[0].address;
  if (user.services?.facebook && user.services?.facebook.email)
    return user.services.facebook.email;
  return null;
};
