import {
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type User,
} from "firebase/auth";

/**
 * Google sign-in with honest failure reasons. The raw SDK throws "the
 * provider is switched off in the console" and "the learner closed the
 * popup" into the same catch block, and for a while I was reporting the
 * first of those as a cancellation. Both callers (sign-in and sign-up) go
 * through this so the messages can't drift apart.
 */

export type GoogleSignInResult =
  | { ok: true; user: User; isNewUser: boolean }
  | {
      ok: false;
      reason: "cancelled" | "popup-blocked" | "not-enabled" | "unauthorised-domain" | "unknown";
      message: string;
    };

const MESSAGES: Record<Exclude<GoogleSignInResult, { ok: true }>["reason"], string> = {
  cancelled: "Google sign-in was cancelled.",
  "popup-blocked":
    "Your browser blocked the Google popup. Allow popups for this site and try again.",
  "not-enabled":
    "Google sign-in isn't switched on for this Firebase project yet. Enable the Google provider in the Firebase console (docs/GOOGLE_SIGNIN.md).",
  "unauthorised-domain":
    "This domain isn't authorised for Google sign-in. Add it under Authentication → Settings → Authorised domains.",
  unknown: "Google sign-in failed. Please try again.",
};

export async function signInWithGoogle(auth: Auth): Promise<GoogleSignInResult> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const cred = await signInWithPopup(auth, provider);
    return {
      ok: true,
      user: cred.user,
      isNewUser: getAdditionalUserInfo(cred)?.isNewUser ?? false,
    };
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    const reason: Exclude<GoogleSignInResult, { ok: true }>["reason"] =
      code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request"
        ? "cancelled"
        : code === "auth/popup-blocked"
          ? "popup-blocked"
          : code === "auth/operation-not-allowed"
            ? "not-enabled"
            : code === "auth/unauthorized-domain"
              ? "unauthorised-domain"
              : "unknown";
    if (reason === "unknown") console.error("[google-signin]", code, err);
    return { ok: false, reason, message: MESSAGES[reason] };
  }
}
