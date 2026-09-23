import { afterEach, describe, expect, it, vi } from "vitest";
import { describeFirebaseError, firebaseCode, isTransient, withRetry } from "@/lib/firebase/errors";

const err = (code: string, message = "boom") => Object.assign(new Error(message), { code });

afterEach(() => vi.useRealTimers());

describe("describeFirebaseError", () => {
  it("turns the common codes into a sentence a learner can act on, keeping the code", () => {
    expect(describeFirebaseError(err("permission-denied"))).toMatch(/refused.*\(permission-denied\)/);
    expect(describeFirebaseError(err("unavailable"))).toMatch(/connection.*\(unavailable\)/);
    expect(describeFirebaseError(err("deadline-exceeded"))).toMatch(/too long/);
    expect(describeFirebaseError(err("unauthenticated"))).toMatch(/not signed in/);
  });

  it("recognises the offline message even without a code", () => {
    expect(describeFirebaseError(new Error("Failed to get document because the client is offline"))).toMatch(/connection/);
  });

  it("falls back to the raw message, with the code if there is one", () => {
    expect(describeFirebaseError(err("weird-code", "odd"))).toBe("odd (weird-code)");
    expect(describeFirebaseError("plain string")).toBe("plain string");
    expect(firebaseCode(undefined)).toBe("");
  });
});

describe("isTransient", () => {
  it("retries the network class and never the rules class", () => {
    for (const c of ["unavailable", "deadline-exceeded", "resource-exhausted", "aborted", "internal"])
      expect(isTransient(err(c))).toBe(true);
    for (const c of ["permission-denied", "invalid-argument", "not-found"]) expect(isTransient(err(c))).toBe(false);
  });
});

describe("withRetry", () => {
  it("retries a transient failure with backoff, then succeeds", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const p = withRetry(async () => {
      if (++calls < 3) throw err("unavailable");
      return "ok";
    }, 3, 100);
    await vi.advanceTimersByTimeAsync(100 + 200);
    await expect(p).resolves.toBe("ok");
    expect(calls).toBe(3);
  });

  it("gives up after the last try and throws the real error", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const p = withRetry(async () => {
      calls++;
      throw err("unavailable");
    }, 2, 50);
    const caught = p.catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1000);
    expect(firebaseCode(await caught)).toBe("unavailable");
    expect(calls).toBe(2);
  });

  it("does not retry an error retrying can't fix", async () => {
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls++;
        throw err("permission-denied");
      }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(calls).toBe(1);
  });
});
