import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";

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
  }
  try {
    await setPersistence(auth, keep ? browserLocalPersistence : browserSessionPersistence);
  } catch (err) {
    console.warn("[auth] persistence not applied", err);
  }
}
