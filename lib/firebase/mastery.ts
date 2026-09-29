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

const PENDING_KEY = (uid: string) => `tm.pendingSessions.${uid}`;

function readPending(uid: string): Set<string> {
  try {
    const raw = localStorage.getItem(PENDING_KEY(uid));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
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
    console.warn("[mastery] session write deferred to reconciliation", err);
    const pending = readPending(uid);
    pending.add(input.sessionId);
    writePending(uid, pending);
    try {
      await updateDoc(sessionRef, { ...closing, masteryApplied: false });
    } catch {
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
