/**
 * Small helpers for the errors Firebase throws at the client.
 *
 * The SDK's messages are written for developers ("Failed to get document
 * because the client is offline"), so `describeFirebaseError` turns the
 * common ones into a sentence a learner can act on and keeps the code in
 * brackets so I can still diagnose it from a screenshot.
 *
 * `withRetry` handles the transient class: the first Firestore call from a
 * freshly loaded page sometimes fails while the transport is still working
 * out whether it can stream, and a second attempt a moment later succeeds.
 */

export function firebaseCode(err: unknown): string {
  return (err as { code?: string })?.code ?? "";
}

export function describeFirebaseError(err: unknown): string {
  const code = firebaseCode(err);
  const message = err instanceof Error ? err.message : String(err);
  if (code === "permission-denied") return "The database refused the request (permission-denied).";
  if (code === "unavailable" || /offline/i.test(message))
    return "Couldn't reach the database. Check your connection, or an ad blocker, and try again (unavailable).";
  if (code === "deadline-exceeded") return "The database took too long to answer (deadline-exceeded).";
  if (code === "unauthenticated") return "You're not signed in any more (unauthenticated).";
  return code ? `${message} (${code})` : message;
}

const TRANSIENT = new Set(["unavailable", "deadline-exceeded", "resource-exhausted", "aborted", "internal"]);

export function isTransient(err: unknown): boolean {
  const code = firebaseCode(err);
  const message = err instanceof Error ? err.message : "";
  return TRANSIENT.has(code) || /offline/i.test(message);
}

/** Run `fn`, retrying transient failures with a short backoff. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3, baseMs = 700): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isTransient(err) || attempt === tries - 1) throw err;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** attempt));
    }
  }
  throw last;
}
