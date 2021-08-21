/**
 * @typedef RATE_LIMITER
 * @type {{TIME_INTERVAL: number, REQUEST_COUNT: number}}
 */
export const RATE_LIMITER = {
  REQUEST_COUNT: 5,
  TIME_INTERVAL: 1000
}