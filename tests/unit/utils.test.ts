import { describe, expect, it } from "vitest";
import { clamp, cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});

describe("clamp", () => {
  it("passes through in-range values", () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it("clamps below", () => {
    expect(clamp(-2, 0, 1)).toBe(0);
  });

  it("clamps above", () => {
    expect(clamp(7, 0, 1)).toBe(1);
  });
});
