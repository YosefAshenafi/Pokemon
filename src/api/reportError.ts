export type ErrorContext = Record<string, unknown>;

export type ErrorReporter = (error: unknown, context?: ErrorContext) => void;

let reporter: ErrorReporter | null = null;

/** Installs the error reporter. Call once, from the root layout. */
export function setErrorReporter(next: ErrorReporter | null): void {
  reporter = next;
}

/** Reports a failure that was already handled gracefully in the UI. */
export function reportError(error: unknown, context?: ErrorContext): void {
  reporter?.(error, context);
}
