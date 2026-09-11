import { doc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";
import { MASTERY_THRESHOLD } from "@/lib/bkt";

/**
 * Write the results of a session into the learner's single mastery document
 * (BUILD_PROMPT section 4: one doc per course, one transaction per write).
 * The quiz session and the end-of-lesson check both come through here, so
 * the model updates the same way whichever one produced the evidence.
 *
 * `after` is the posterior pL per KC at the end of the session, and
 * `attempts` is how many answers each KC got. History keeps the last 200
 * points for the mastery-over-time chart.
 */
export interface KcRecord {
  pL: number;
  attempts: number;
  lastSeen: number;
  masteredAt: number | null;
}

export async function applyMasteryUpdates(
  db: Firestore,
  uid: string,
  courseId: string,
  after: Record<string, number>,
  attempts: Record<string, number>,
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "users", uid, "mastery", courseId);
    const snap = await tx.get(ref);
    const existing = (snap.data()?.kcs ?? {}) as Record<string, KcRecord>;
    const history = (snap.data()?.history ?? []) as Array<{ ts: number; kcId: string; pL: number }>;
    const kcs = { ...existing };
    const newHistory = [...history];
    const now = Date.now();
    for (const [kcId, count] of Object.entries(attempts)) {
      const prev = kcs[kcId];
      const pL = after[kcId] ?? prev?.pL ?? 0;
      kcs[kcId] = {
        pL,
        attempts: (prev?.attempts ?? 0) + count,
        lastSeen: now,
        masteredAt: prev?.masteredAt ?? (pL >= MASTERY_THRESHOLD ? now : null),
      };
      newHistory.push({ ts: now, kcId, pL });
    }
    tx.set(ref, { kcs, history: newHistory.slice(-200), updatedAt: serverTimestamp() }, { merge: true });
  });
}
