import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * The Firebase client singleton. With NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
 * the SDK talks to the local Emulator Suite (ports are in firebase.json),
 * and the `demo-` project prefix keeps the emulator completely offline. So
 * there's no way for local testing to touch production.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "localhost",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-trademind",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "demo-trademind.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "0",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "demo-app-id",
};

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

function createApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(config);
}

let connected = false;

export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } {
  const app = createApp();
  const auth = getAuth(app);
  // Safari and WebKit hang on Firestore's fetch-stream transport against the
  // emulator once result sets get bigger. Auto-detect falls back to long polling.
  let db: Firestore;
  try {
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    db = getFirestore(app); // already initialised, which happens under HMR
  }
  const storage = getStorage(app);

  if (useEmulators && !connected && typeof window !== "undefined") {
    connected = true;
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
  }

  return { app, auth, db, storage };
}
