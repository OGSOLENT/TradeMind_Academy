import type { Item } from "./types";

/**
 * Removes the positional tells from the authored item bank.
 *
 * Writing 116 questions by hand leaves fingerprints, and a measurement of
 * the bank on 22 September 2026 found three that a learner could exploit
 * without knowing any trading at all:
 *
 *   - 46 of 55 multiple-choice answers (84%) were option 2. Option 1 was
 *     correct once; option 4 never. "Always pick B" scored 84%.
 *   - Every one of the 16 multi-select items included option 1 in its
 *     answer.
 *   - All 15 ordering items shipped with their entries already in the
 *     correct sequence, and the quiz starts an ordering item in the order
 *     given, so submitting without touching anything scored 100%.
 *
 * That is a validity problem before it's a fairness one: the learner model
 * is only as good as the evidence each answer carries, and an answer a
 * learner can get right by position carries none. It would have quietly
 * inflated placement scores, mastery estimates and post-test gains.
 *
 * The fix is applied at generate time, not in the browser, so the option
 * order is fixed in content/level1.json and identical for every learner.
 * That matters for the research log: a response row stores the index the
 * learner chose, and an index has to mean the same thing in every row for
 * the log to be analysable. Per-learner shuffling would have made the
 * stored indices incomparable.
 *
 * Determinism comes from hashing the item id, so a rebuild reproduces the
 * same bank exactly and the seeded database, the tests and the deployed
 * site never disagree.
 */

/** FNV-1a. Small, dependency-free, and good enough to seed a permutation. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: a tiny seeded PRNG, so the shuffle is reproducible. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(xs: readonly T[], rand: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Where each multiple-choice answer should sit. Handing out positions
 * round-robin and then shuffling that list gives a near-perfectly even
 * spread (unlike shuffling each item independently, which leaves the count
 * lumpy at this sample size) without leaving a repeating 1-2-3-4 cycle
 * anyone could notice.
 */
function balancedPositions(n: number, optionCount: number, rand: () => number): number[] {
  const targets: number[] = [];
  for (let i = 0; i < n; i++) targets.push(i % optionCount);
  return shuffled(targets, rand);
}

export function debiasItems(items: Item[]): Item[] {
  const out = items.map((it) => ({ ...it }));

  // ---- Multiple choice: even spread of the correct position ----
  const mcqIdx = out
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.payload.type === "mcq" && it.answerKey.type === "mcq")
    // Sorted by id so the assignment doesn't depend on array order.
    .sort((a, b) => a.it.id.localeCompare(b.it.id));

  const optionCount = 4;
  const targets = balancedPositions(mcqIdx.length, optionCount, rng(hash("mcq-positions")));

  mcqIdx.forEach(({ it, i }, k) => {
    if (it.payload.type !== "mcq" || it.answerKey.type !== "mcq") return;
    const options = it.payload.options;
    const correct = it.answerKey.correct;
    const target = Math.min(targets[k]!, options.length - 1);

    // Put the right answer at its target seat and scatter the distractors
    // through the rest, so nothing else keeps its authored position either.
    const distractors = shuffled(
      options.map((o, idx) => ({ o, idx })).filter(({ idx }) => idx !== correct),
      rng(hash(it.id)),
    );
    const next: string[] = [];
    let d = 0;
    for (let pos = 0; pos < options.length; pos++) {
      next.push(pos === target ? options[correct]! : distractors[d++]!.o);
    }
    out[i] = {
      ...it,
      payload: { ...it.payload, options: next },
      answerKey: { ...it.answerKey, correct: target },
    };
  });

  // ---- Multi-select and ordering ----
  for (let i = 0; i < out.length; i++) {
    const it = out[i]!;

    if (it.payload.type === "multi" && it.answerKey.type === "multi") {
      const rand = rng(hash(it.id + ":multi"));
      const perm = shuffled(it.payload.options.map((_, k) => k), rand);
      const options = perm.map((k) => it.payload.type === "multi" ? it.payload.options[k]! : "");
      const correctSet = new Set(it.answerKey.correct);
      // perm[newIndex] = oldIndex, so an option is correct at its new seat
      // if the old index it came from was correct.
      const correct = perm
        .map((oldIdx, newIdx) => (correctSet.has(oldIdx) ? newIdx : -1))
        .filter((x) => x >= 0)
        .sort((a, b) => a - b);
      out[i] = {
        ...it,
        payload: { ...it.payload, options },
        answerKey: { ...it.answerKey, correct },
      };
      continue;
    }

    if (it.payload.type === "ordering" && it.answerKey.type === "ordering") {
      const entries = it.payload.entries;
      const n = entries.length;
      // The authored answer key is the sequence of entry indices in correct
      // order. Rearranging the entries means the key has to be rewritten to
      // point at the same strings in their new seats.
      const correctSequence = it.answerKey.order.map((k) => entries[k]!);

      const rand = rng(hash(it.id + ":ordering"));
      let perm = shuffled(entries.map((_, k) => k), rand);
      // A shuffle that leaves the entries in the answer's order would hand
      // the learner the mark for doing nothing, which is the bug being
      // fixed here, so keep drawing until it doesn't.
      const isIdentityAnswer = (p: number[]) =>
        p.every((oldIdx, newIdx) => entries[oldIdx] === correctSequence[newIdx]);
      let guard = 0;
      while (n > 1 && isIdentityAnswer(perm) && guard++ < 50) {
        perm = shuffled(entries.map((_, k) => k), rand);
      }

      const nextEntries = perm.map((k) => entries[k]!);
      // Where each step of the correct sequence now sits.
      const used = new Set<number>();
      const order = correctSequence.map((label) => {
        const at = nextEntries.findIndex((e, idx) => e === label && !used.has(idx));
        used.add(at);
        return at;
      });
      out[i] = {
        ...it,
        payload: { ...it.payload, entries: nextEntries },
        answerKey: { ...it.answerKey, order },
      };
    }
  }

  return out;
}
