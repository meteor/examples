import { Instrumentation } from 'meteor/instrumentation';

export function configureInstrumentation() {
  Instrumentation.configure({
    // Client IP addresses are personal data: leave them out.
    captureClientAddress: false,
    // Runs on the listener path, so it stays synchronous and short.
    onListenerError(error, event) {
      const message = String(error?.message ?? error).slice(0, 200);
      console.error(`[observability] listener failed on ${event.type}: ${message}`);
    },
  });

  // Arguments are not captured by default. This projection records the
  // length of a new task's text, never the text itself.
  Instrumentation.configureMethod('tasks.insert', {
    captureArgs: ([text]) => ({ textLength: typeof text === 'string' ? text.length : 0 }),
  });
}
