/**
 * Error thrown by the axios layer when the backend returns a response that
 * carries a human-readable `message`. Being a real `Error` subclass means the
 * ubiquitous `err instanceof Error ? err.message : <ui fallback>` call sites
 * automatically surface the backend message. When the backend sends no message
 * the axios layer rejects with the raw payload instead (not an ApiError), so
 * those same call sites fall back to their UI message.
 */
export class ApiError extends Error {
  readonly success = false;
  readonly statusCode?: number;
  readonly payload?: unknown;

  constructor(message: string, statusCode?: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

/**
 * Resolves the message to show the user: prefer a backend-provided message,
 * otherwise the supplied UI fallback. Use at call sites that need explicit
 * control over the fallback (e.g. "This item is out of stock").
 */
export function getApiErrorMessage(err: unknown, uiFallback: string): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string' &&
    (err as { message: string }).message.trim()
  ) {
    return (err as { message: string }).message.trim();
  }
  return uiFallback;
}
