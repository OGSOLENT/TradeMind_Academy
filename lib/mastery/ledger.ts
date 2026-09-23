import {
  DEFAULT_PARAMS,
  MASTERY_THRESHOLD,
  initialiseFromPlacement,
  updateMastery,
  type BktParams,
} from "@/lib/bkt";

/**
 * The mastery document as a ledger.
 *
 * Every answer a learner gives is written to the append-only response log
 * before anything else happens (lib/logging). The mastery document is the
 * thing the dashboard, the routing and the skill map read, but it is only
 * ever a summary of that log: fold the answers through BKT in the order
 * they were given and you get it back exactly. So the log is the source of
 * truth and the mastery document is a cache of it.
 *
 * That matters because the cache can go wrong in two ways the log cannot. A
 * write at the end of a session can fail (the learner closes the laptop, the
 * connection drops), and before this module that session's learning was
 * simply lost from the model. And the document is writable by its owner, so
 * it can be edited. Both are repaired the same way: rebuild the document
 * from the log.
 *
 * Everything here is pure, so the rebuild can be checked against hand-worked
 * values, and so the live write and the rebuild can share the same code and
 * cannot drift apart (tests/unit/ledger.test.ts proves they agree).
 */

export interface KcRecord {
  pL: number;
  attempts: number;
  lastSeen: number;
  masteredAt: number | null;
}

export interface HistoryPoint {
  ts: number;
  kcId: string;
  pL: number;
}

export interface MasteryDoc {
  kcs: Record<string, KcRecord>;
  history: HistoryPoint[];
}

/** How a session type touches the model. */
export type SessionKind = "placement" | "practice" | "assessment";

export function kindOf(type: string): SessionKind {
  if (type === "placement") return "placement";
  // The post-test measures; it never moves the model (lib/quiz/session-store).
  if (type === "post-test") return "assessment";
  return "practice";
}

export interface LoggedAnswer {
  kcId: string;
  correct: boolean;
  ts: number;
}

export interface LoggedSession {
  id: string;
  type: string;
  answers: LoggedAnswer[];
}

/** The mastery-over-time chart keeps this many points. */
export const HISTORY_LIMIT = 200;

export function emptyDoc(): MasteryDoc {
  return { kcs: {}, history: [] };
}

/**
 * A placement replaces the model outright: every KC gets its initial
 * estimate, attempts restart at the placement's own count, and the history
 * starts again. This is what the placement completion has always written.
 */
export function applyPlacement(
  kcIds: string[],
  answers: LoggedAnswer[],
  at: number,
  params: BktParams = DEFAULT_PARAMS,
): MasteryDoc {
  const initial = initialiseFromPlacement(answers, kcIds, params);
  const kcs: Record<string, KcRecord> = {};
  for (const kcId of kcIds) {
    const pL = initial[kcId] ?? params.pL0;
    kcs[kcId] = {
      pL,
      attempts: answers.filter((a) => a.kcId === kcId).length,
      lastSeen: at,
      masteredAt: pL >= MASTERY_THRESHOLD ? at : null,
    };
  }
  return { kcs, history: [] };
}

/**
 * A practice session merges in: each KC it touched takes its final estimate,
 * adds its attempts, and records a history point. masteredAt is the first
 * time the KC crossed the threshold and is never cleared, matching the
 * mastery ceremony, which only ever fires once.
 */
export function mergePractice(
  doc: MasteryDoc,
  after: Record<string, number>,
  attempts: Record<string, number>,
  at: number,
): MasteryDoc {
  const kcs = { ...doc.kcs };
  const history = [...doc.history];
  for (const [kcId, count] of Object.entries(attempts)) {
    const prev = kcs[kcId];
    const pL = after[kcId] ?? prev?.pL ?? DEFAULT_PARAMS.pL0;
    kcs[kcId] = {
      pL,
      attempts: (prev?.attempts ?? 0) + count,
      lastSeen: at,
      masteredAt: prev?.masteredAt ?? (pL >= MASTERY_THRESHOLD ? at : null),
    };
    history.push({ ts: at, kcId, pL });
  }
  return { kcs, history: history.slice(-HISTORY_LIMIT) };
}

/**
 * Replay one practice session's answers from the model as it stood when the
 * session began, exactly as the live session did: each answer is one BKT
 * step on the running estimate for its KC.
 */
export function replayPractice(
  doc: MasteryDoc,
  answers: LoggedAnswer[],
  params: BktParams = DEFAULT_PARAMS,
): { after: Record<string, number>; attempts: Record<string, number> } {
  const running: Record<string, number> = {};
  const attempts: Record<string, number> = {};
  for (const a of [...answers].sort((x, y) => x.ts - y.ts)) {
    const prior = running[a.kcId] ?? doc.kcs[a.kcId]?.pL ?? params.pL0;
    running[a.kcId] = updateMastery(prior, a.correct, params).pL;
    attempts[a.kcId] = (attempts[a.kcId] ?? 0) + 1;
  }
  return { after: running, attempts };
}

/**
 * Rebuild the mastery document from the whole log. Sessions are applied in
 * the order their first answer was given; sessions with no answers changed
 * nothing when they ran and change nothing here.
 */
export function rebuildMastery(
  kcIds: string[],
  sessions: LoggedSession[],
  params: BktParams = DEFAULT_PARAMS,
): MasteryDoc {
  const ordered = sessions
    .filter((s) => s.answers.length > 0)
    .map((s) => ({ ...s, first: Math.min(...s.answers.map((a) => a.ts)) }))
    .sort((a, b) => a.first - b.first);

  let doc = emptyDoc();
  for (const s of ordered) {
    const kind = kindOf(s.type);
    if (kind === "assessment") continue;
    const at = Math.max(...s.answers.map((a) => a.ts));
    if (kind === "placement") {
      doc = applyPlacement(kcIds, s.answers, at, params);
    } else {
      const { after, attempts } = replayPractice(doc, s.answers, params);
      doc = mergePractice(doc, after, attempts, at);
    }
  }
  return doc;
}

/**
 * Whether two mastery maps disagree on anything that matters. Timestamps are
 * left out on purpose: the live write stamps the moment the session closed,
 * the rebuild stamps the last answer, and neither is wrong.
 */
export function masteryDiffers(
  a: Record<string, Pick<KcRecord, "pL" | "attempts">>,
  b: Record<string, Pick<KcRecord, "pL" | "attempts">>,
  eps = 1e-9,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const x = a[k];
    const y = b[k];
    if (!x || !y) return true;
    if (Math.abs(x.pL - y.pL) > eps || x.attempts !== y.attempts) return true;
  }
  return false;
}
