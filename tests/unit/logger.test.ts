import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResponseLogger, type ResponseEvent } from "@/lib/logging/logger";

function makeEvent(n: number): ResponseEvent {
  return {
    uid: "u1",
    sessionId: "s1",
    itemId: `item-${n}`,
    kcId: "kc-1",
    questionType: "mcq",
    correct: true,
    selected: 1,
    latencyMs: 1000,
    pLBefore: 0.25,
    pLAfter: 0.648,
    ts: 1700000000000 + n,
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("ResponseLogger", () => {
  it("flushes enqueued events in order", async () => {
    const sent: string[] = [];
    const logger = new ResponseLogger({
      send: async (e) => void sent.push(e.itemId),
    });
    logger.enqueue(makeEvent(1));
    logger.enqueue(makeEvent(2));
    await logger.flush();
    expect(sent).toEqual(["item-1", "item-2"]);
    expect(logger.pending).toBe(0);
  });

  it("NEVER drops on failure — re-queues and surfaces the error", async () => {
    const errors: number[] = [];
    let failTimes = 2;
    const sent: string[] = [];
    const logger = new ResponseLogger({
      send: async (e) => {
        if (failTimes-- > 0) throw new Error("offline");
        sent.push(e.itemId);
      },
      backoffBaseMs: 1,
      onError: (_, queued) => void errors.push(queued),
    });
    logger.enqueue(makeEvent(1));
    await logger.flush();
    expect(logger.pending).toBe(1); // still queued after failure
    expect(errors.length).toBeGreaterThan(0);

    await new Promise((r) => setTimeout(r, 30)); // allow backoff retries
    expect(sent).toEqual(["item-1"]);
    expect(logger.pending).toBe(0);
  });

  it("persists unflushed events across restarts (localStorage)", async () => {
    const dead = new ResponseLogger({
      send: async () => {
        throw new Error("network down");
      },
      backoffBaseMs: 100_000, // so it doesn't retry during the test
    });
    dead.enqueue(makeEvent(1));
    dead.enqueue(makeEvent(2));
    await new Promise((r) => setTimeout(r, 5));
    expect(dead.pending).toBe(2);

    // A "refresh": a new logger instance restores from the same storage key
    const sent: string[] = [];
    const revived = new ResponseLogger({ send: async (e) => void sent.push(e.itemId) });
    expect(revived.pending).toBe(2);
    await revived.flush();
    expect(sent).toEqual(["item-1", "item-2"]);
    expect(revived.pending).toBe(0);
  });

  it("backoff doubles per consecutive failure up to the cap", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const logger = new ResponseLogger({
      send: async () => {
        attempts++;
        throw new Error("still offline");
      },
      backoffBaseMs: 1000,
      backoffCapMs: 4000,
    });
    logger.enqueue(makeEvent(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(attempts).toBe(1);
    await vi.advanceTimersByTimeAsync(1000); // retry #1 after base
    expect(attempts).toBe(2);
    await vi.advanceTimersByTimeAsync(2000); // retry #2 after 2×base
    expect(attempts).toBe(3);
    await vi.advanceTimersByTimeAsync(4000); // retry #3 capped
    expect(attempts).toBe(4);
    expect(logger.pending).toBe(1); // still never dropped
  });

  it("parks an event the server refuses outright, so it can't block the answers behind it", async () => {
    // Before the September audit a permanently rejected row stayed at the
    // head of the queue forever and nothing after it was ever written.
    const sent: string[] = [];
    const parked: string[] = [];
    const logger = new ResponseLogger({
      send: async (e) => {
        if (e.itemId === "item-2") throw Object.assign(new Error("denied"), { code: "permission-denied" });
        sent.push(e.itemId);
      },
      isPermanent: (err) => (err as { code?: string }).code === "permission-denied",
      onDeadLetter: (e) => void parked.push(e.itemId),
    });
    logger.enqueue(makeEvent(1));
    logger.enqueue(makeEvent(2));
    logger.enqueue(makeEvent(3));
    await logger.flush();
    expect(sent).toEqual(["item-1", "item-3"]);
    expect(parked).toEqual(["item-2"]);
    expect(logger.pending).toBe(0);
    expect(logger.deadLettered).toBe(1);
  });

  it("keeps parked events across a restart and gives them one more try", async () => {
    const refuse = new ResponseLogger({
      send: async () => {
        throw Object.assign(new Error("denied"), { code: "permission-denied" });
      },
      isPermanent: () => true,
    });
    refuse.enqueue(makeEvent(7));
    await refuse.flush();
    expect(refuse.deadLettered).toBe(1);

    // A new logger (the next page load) finds it and retries it.
    const sent: string[] = [];
    const revived = new ResponseLogger({ send: async (e) => void sent.push(e.itemId) });
    expect(revived.deadLettered).toBe(1);
    revived.start();
    await revived.flush();
    expect(sent).toEqual(["item-7"]);
    expect(revived.deadLettered).toBe(0);
  });

  it("still retries a transient error rather than parking it", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const logger = new ResponseLogger({
      send: async () => {
        attempts++;
        if (attempts < 3) throw Object.assign(new Error("offline"), { code: "unavailable" });
      },
      isPermanent: (err) => (err as { code?: string }).code === "permission-denied",
      backoffBaseMs: 100,
    });
    logger.enqueue(makeEvent(9));
    await vi.advanceTimersByTimeAsync(1000);
    expect(attempts).toBe(3);
    expect(logger.deadLettered).toBe(0);
    expect(logger.pending).toBe(0);
  });
});
