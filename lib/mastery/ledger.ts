import {
  DEFAULT_PARAMS,
  MASTERY_THRESHOLD,
  initialiseFromPlacement,
  updateMastery,
  type BktParams,
} from "@/lib/bkt";

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
