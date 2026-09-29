import type { Item } from "./types";

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

function balancedPositions(n: number, optionCount: number, rand: () => number): number[] {
  const targets: number[] = [];
  for (let i = 0; i < n; i++) targets.push(i % optionCount);
  return shuffled(targets, rand);
}

export function debiasItems(items: Item[]): Item[] {
  const out = items.map((it) => ({ ...it }));

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

  for (let i = 0; i < out.length; i++) {
    const it = out[i]!;

    if (it.payload.type === "multi" && it.answerKey.type === "multi") {
      const rand = rng(hash(it.id + ":multi"));
      const perm = shuffled(it.payload.options.map((_, k) => k), rand);
      const options = perm.map((k) => it.payload.type === "multi" ? it.payload.options[k]! : "");
      const correctSet = new Set(it.answerKey.correct);
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
      const correctSequence = it.answerKey.order.map((k) => entries[k]!);

      const rand = rng(hash(it.id + ":ordering"));
      let perm = shuffled(entries.map((_, k) => k), rand);
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
