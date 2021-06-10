import {TAPi18n} from 'meteor/tap:i18n';

/**
 * @param key {string}
 * @param options {*}
 * @return {*}
 */
export const lang = (key, options = '') =>
{
  return TAPi18n.__(key, options);
};