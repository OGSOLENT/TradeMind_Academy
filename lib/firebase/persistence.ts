import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";

/**
 * "Keep me signed in". Firebase keeps a session in IndexedDB by default, so
 * a learner stays signed in until they sign out. That's right for a phone
 * or a laptop that's theirs, and wrong for a library machine. The checkbox
 * on the sign-in and sign-up forms picks between the two: local persistence
 * (survives closing the browser) or session persistence (gone when the tab
 * closes). The choice is remembered on the device so the box comes back
 * the way they left it, and the settings page can flip it later without a
 * fresh sign-in because setPersistence also migrates the current session.
 */

const KEY = "tm.keepSignedIn";

export function readKeepSignedIn(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

export async function applyPersistence(auth: Auth, keep: boolean): Promise<void> {
  try {
    window.localStorage.setItem(KEY, keep ? "1" : "0");
  } catch {
    // Private mode. The persistence call below still does the real work.
  }
  try {
    await setPersistence(auth, keep ? browserLocalPersistence : browserSessionPersistence);
  } catch (err) {
    // Some browsers refuse storage entirely (strict private modes). Sign-in
    // still works, it just won't outlive the tab, which is the safe side.
    console.warn("[auth] persistence not applied", err);
  }
}
