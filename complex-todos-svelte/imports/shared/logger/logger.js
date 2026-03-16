/**
 * Simple console-based logger replacing ostrio:logger
 */
const log = {
  info(...args) {
    console.info('[INFO]', ...args);
  },
  debug(...args) {
    console.debug('[DEBUG]', ...args);
  },
  warn(...args) {
    console.warn('[WARN]', ...args);
  },
  error(...args) {
    console.error('[ERROR]', ...args);
  },
  fatal(...args) {
    console.error('[FATAL]', ...args);
  }
};

export {log};
