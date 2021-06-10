/**
 * @param reference {*}
 * @return {boolean}
 */
export const isUndefined = (reference) =>
{
  return reference === void 0;
};

/**
 * @param reference {*}
 * @return {boolean}
 */
export const isDefined = (reference) =>
{
  return !isUndefined(reference);
};