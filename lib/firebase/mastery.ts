import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import {
  applyPlacement,
  emptyDoc,
  kindOf,
  masteryDiffers,
  mergePractice,
  rebuildMastery,
  type LoggedAnswer,
  type LoggedSession,
  type MasteryDoc,
  type SessionKind,
} from "@/lib/mastery/ledger";
import { withRetry } from "./errors";
import { parseMasteryDoc } from "./schemas";

export type { KcRecord } from "@/lib/mastery/ledger";

/**
 * Writing the learner model.
 *
 * The mastery document is a cache of the response log (lib/mastery/ledger
 * explains why). Two functions keep that cache honest:
 *
 *   completeSession   closes a session and writes its result in ONE
 *                     transaction, so a session is either ended and applied
 *                     or neither. Transient failures are retried; if the
 *                     write still fails, the session is remembered locally
 *                     and left unapplied.
 *
 *   reconcileMastery  runs when the learning area opens. If any finished
 *                     session was never applied, it rebuilds the whole
 *                     document from the log and marks those sessions
 *                     repaired, which is also how a researcher can see
 *                     that a repair happened (scripts/analyse.ts counts
 *                     them).
 *
 * Before this, a failed end-of-session write was caught and ignored under a
 * comment saying the document would "catch up on the next completed
 * session". It didn't: the next session started from the stale document and
 * that session's learning was gone from the model for good.
 */

const PENDING_KEY = (uid: string) => `tm.pendingSessions.${uid}`;

function readPending(uid: string): Set<string> {
  try {
    const raw = localStorage.getItem(PENDING_KEY(uid));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    // No storage (private mode, server render). Firestore-side reconciliation still works.
    return new Set();
  }
}

function writePending(uid: string, ids: Set<string>) {
  try {
    if (ids.size === 0) localStorage.removeItem(PENDING_KEY(uid));
    else localStorage.setItem(PENDING_KEY(uid), JSON.stringify([...ids]));
  } catch {
    // Same as above: best effort only.
  }
}

export interface CompleteSessionInput {
  sessionId: string;
  /** The session doc's `type`. */
  type: string;
  /** Final estimate per KC the session touched (practice kinds). */
  after?: Record<string, number>;
  /** Answers per KC in this session (practice kinds). */
  attempts?: Record<string, number>;
  /** Every KC id in the course, and the answers given (placement). */
  kcIds?: string[];
  placementAnswers?: LoggedAnswer[];
  score?: { correct: number; total: number };
}

function nextDoc(kind: SessionKind, existing: MasteryDoc, input: CompleteSessionInput, at: number): MasteryDoc | null {
  if (kind === "assessment") return null;
  if (kind === "placement") return applyPlacement(input.kcIds ?? [], input.placementAnswers ?? [], at);
  return mergePractice(existing, input.after ?? {}, input.attempts ?? {}, at);
}

/**
 * Close a session and write its result atomically. Resolves true when the
 * model is up to date, false when the write had to be deferred to the next
 * reconciliation. It never throws, because the caller is an end-of-session
 * screen that should not fall over on a bad connection.
 */
export async function completeSession(
  db: Firestore,
  uid: string,
  courseId: string,
  input: CompleteSessionInput,
): Promise<boolean> {
  const kind = kindOf(input.type);
  const sessionRef = doc(db, "users", uid, "sessions", input.sessionId);
  const masteryRef = doc(db, "users", uid, "mastery", courseId);
  const closing = {
    endedAt: serverTimestamp(),
    masteryApplied: true,
    ...(input.score ? { score: input.score } : {}),
  };

  try {
    await withRetry(() =>
      runTransaction(db, async (tx) => {
        const snap = await tx.get(masteryRef);
        const existing = snap.exists() ? parseMasteryDoc(snap.data()) : emptyDoc();
        const next = nextDoc(kind, existing, input, Date.now());
        if (next) tx.set(masteryRef, { ...next, updatedAt: serverTimestamp() });
        tx.update(sessionRef, closing);
      }),
    );
    const pending = readPending(uid);
    if (pending.delete(input.sessionId)) writePending(uid, pending);
    return true;
  } catch (err) {
    // The answers are already in the log. Record that this session still
    // needs applying, try at least to mark it ended, and let
    // reconcileMastery rebuild the model from the log next time.
    console.warn("[mastery] session write deferred to reconciliation", err);
    const pending = readPending(uid);
    pending.add(input.sessionId);
    writePending(uid, pending);
    try {
      await updateDoc(sessionRef, { ...closing, masteryApplied: false });
    } catch {
      // Offline. The local marker is enough for this device.
    }
    return false;
  }
}

interface SessionRow {
  id: string;
  type: string;
  ended: boolean;
  applied: boolean;
}

/**
 * Rebuild the mastery document from the log if any finished session was
 * never applied. Returns how many sessions were repaired (0 almost always).
 */
export async function reconcileMastery(db: Firestore, uid: string, courseId: string): Promise<number> {
  const pending = readPending(uid);
  const snap = await getDocs(collection(db, "users", uid, "sessions"));
  const rows: SessionRow[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: String(data.type ?? ""),
      ended: data.endedAt != null || pending.has(d.id),
      applied: data.masteryApplied === true,
    };
  });

  const counts = (r: SessionRow) => r.ended && kindOf(r.type) !== "assessment";
  const unapplied = rows.filter((r) => counts(r) && !r.applied);
  if (unapplied.length === 0) {
    if (pending.size) writePending(uid, new Set());
    return 0;
  }

  // Read the log for every session that counts, and the course's KC ids for
  // any placement in it.
  const included = rows.filter(counts);
  const sessions: LoggedSession[] = await Promise.all(
    included.map(async (r) => {
      const rs = await getDocs(collection(db, "users", uid, "sessions", r.id, "responses"));
      return {
        id: r.id,
        type: r.type,
        answers: rs.docs.map((x) => {
          const v = x.data();
          return { kcId: String(v.kcId), correct: v.correct === true, ts: Number(v.ts ?? 0) };
        }),
      };
    }),
  );
  const kcIds = (await getDocs(collection(db, "kcs"))).docs.map((d) => d.id);
  const rebuilt = rebuildMastery(kcIds, sessions);

  const masteryRef = doc(db, "users", uid, "mastery", courseId);
  const current = await getDoc(masteryRef);
  const currentKcs = current.exists() ? parseMasteryDoc(current.data()).kcs : {};

  const batch = writeBatch(db);
  if (masteryDiffers(currentKcs, rebuilt.kcs)) {
    batch.set(masteryRef, { ...rebuilt, updatedAt: serverTimestamp(), rebuiltAt: serverTimestamp() });
  }
  for (const r of unapplied) {
    batch.update(doc(db, "users", uid, "sessions", r.id), {
      masteryApplied: true,
      repairedAt: serverTimestamp(),
      ...(pending.has(r.id) ? { endedAt: serverTimestamp() } : {}),
    });
  }
  await batch.commit();
  writePending(uid, new Set());
  return unapplied.length;
}
