export interface ErrorContext {
  source: 'boundary' | 'window' | 'unhandledrejection' | 'query';
  componentStack?: string | null;
}

/**
 * ERR-23: the frontend counterpart of the API's ErrorReporter. Call sites depend on this
 * interface; the console implementation can be replaced by Sentry or similar.
 */
export interface ErrorReporter {
  report(error: unknown, context: ErrorContext): void;
}

export const consoleErrorReporter: ErrorReporter = {
  report(error, context) {
    // The only place that writes errors to the console on purpose.
    // eslint-disable-next-line no-console
    console.error('[app error]', context, error);
  },
};

/** ERR-23: errors that escape React (event handlers, timers, promises). */
export function installGlobalErrorHandlers(reporter: ErrorReporter, target: Window = window): void {
  target.addEventListener('error', (event) => {
    reporter.report(event.error ?? event.message, { source: 'window' });
  });
  target.addEventListener('unhandledrejection', (event) => {
    reporter.report(event.reason, { source: 'unhandledrejection' });
  });
}
