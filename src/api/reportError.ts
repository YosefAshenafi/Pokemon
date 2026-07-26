/**
 * The one place a handled failure is reported.
 *
 * Deliberately a seam rather than a hard dependency on Sentry or Bugsnag: the
 * call sites - the query cache, the render boundary, the response parser - are
 * the parts that are hard to retrofit, and they are in place now. Choosing a
 * vendor becomes a single `setErrorReporter` call in the root layout, with no
 * further edits and nothing to unpick if the choice changes.
 *
 * Nothing is reported until a reporter is installed, so tests and development
 * builds stay silent by default.
 */

export type ErrorContext = Record<string, unknown>;

export type ErrorReporter = (error: unknown, context?: ErrorContext) => void;

let reporter: ErrorReporter | null = null;

/** Installs the reporter. Call once, from the root layout. */
export function setErrorReporter(next: ErrorReporter | null): void {
  reporter = next;
}

/**
 * Reports a failure we have already handled, so that degrading gracefully in
 * the UI does not also mean going unnoticed by us.
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  reporter?.(error, context);
}
