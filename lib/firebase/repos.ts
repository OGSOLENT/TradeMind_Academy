import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import type { Course, Item, Kc, Lesson } from "@/lib/content/types";
import { CONSENT_VERSION, defaultSettings, type UserProfile } from "./types";
import { withRetry } from "./errors";

/**
 * The Firestore repositories. Content collections are read-only from the
 * client (the rules only let an admin write them), and user docs all live
 * under users/{uid}.
 */

/* The three profile calls retry on transient transport errors, because they
   are the first thing a fresh page asks Firestore for and the first attempt
   is the one most likely to catch the connection still settling. */

export async function createUserProfile(db: Firestore, uid: string, displayName: string, isAdult: boolean) {
  await withRetry(() =>
    setDoc(doc(db, "users", uid), {
      displayName,
      createdAt: serverTimestamp(),
      consent: null, // only ever set on the consent screen, never implied
      isAdult,
      settings: defaultSettings,
    }),
  );
}

export async function recordConsent(db: Firestore, uid: string) {
  await withRetry(() =>
    updateDoc(doc(db, "users", uid), {
      consent: { agreedAt: serverTimestamp(), version: CONSENT_VERSION },
    }),
  );
}

export async function getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
  const snap = await withRetry(() => getDoc(doc(db, "users", uid)));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function getCourse(db: Firestore, courseId: string): Promise<Course | null> {
  const snap = await getDoc(doc(db, "courses", courseId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Course) : null;
}

export async function getKcs(db: Firestore, courseId: string): Promise<Kc[]> {
  const snap = await getDocs(query(collection(db, "kcs"), where("courseId", "==", courseId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kc);
}

/** Every lesson in a knowledge component, in curriculum order. */
export async function getLessonsByKc(db: Firestore, kcId: string): Promise<Lesson[]> {
  const snap = await getDocs(query(collection(db, "lessons"), where("kcId", "==", kcId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Lesson)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function getLessonByKc(db: Firestore, kcId: string): Promise<Lesson | null> {
  const snap = await getDocs(query(collection(db, "lessons"), where("kcId", "==", kcId)));
  const first = snap.docs[0];
  return first ? ({ id: first.id, ...first.data() } as Lesson) : null;
}

export async function getLesson(db: Firestore, lessonId: string): Promise<Lesson | null> {
  const snap = await getDoc(doc(db, "lessons", lessonId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Lesson) : null;
}

export async function getItem(db: Firestore, itemId: string): Promise<Item | null> {
  const snap = await getDoc(doc(db, "items", itemId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Item) : null;
}
