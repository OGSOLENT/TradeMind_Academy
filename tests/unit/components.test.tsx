import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { WhyPopover } from "@/components/learn/quiz/why-popover";
import { nextItem } from "@/lib/routing";
import { MASTERY_THRESHOLD, REMEDIATION_THRESHOLD } from "@/lib/bkt";
import type { Item } from "@/lib/content/types";

/*
 * Two interface claims the report makes, checked in the rendered component
 * rather than taken on trust:
 *
 *   - the mastery ring colours a module by the same bands the routing engine
 *     uses (requirement N2: thresholds defined once), so the ring can never
 *     say "mastered" at a value the engine still treats as practice;
 *   - the "Why this question?" panel shows the engine's actual decision
 *     object, not a reconstruction of it (RQ3, the open learner model).
 */

beforeAll(() => {
  // jsdom has no matchMedia; Framer Motion asks it about reduced motion.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});
afterEach(cleanup);

const ringColour = (value: number) => {
  const { container } = render(<MasteryRing value={value} />);
  const arc = container.querySelectorAll("circle")[1]!;
  const colour = arc.getAttribute("stroke");
  cleanup();
  return colour;
};

describe("MasteryRing", () => {
  it("changes colour exactly at the model's thresholds", () => {
    expect(ringColour(REMEDIATION_THRESHOLD - 0.001)).toBe("var(--warning)");
    expect(ringColour(REMEDIATION_THRESHOLD)).toBe("var(--accent)");
    expect(ringColour(MASTERY_THRESHOLD - 0.001)).toBe("var(--accent)");
    expect(ringColour(MASTERY_THRESHOLD)).toBe("var(--mastery)");
  });

  it("announces the value to a screen reader and clamps impossible input", () => {
    render(<MasteryRing value={0.8} />);
    expect(screen.getByRole("img", { name: "Mastery 80 percent" })).toBeTruthy();
    cleanup();
    render(<MasteryRing value={1.7} />);
    expect(screen.getByRole("img", { name: "Mastery 100 percent" })).toBeTruthy();
  });
});

describe("WhyPopover", () => {
  const item = (id: string, difficulty: Item["difficulty"]): Item => ({
    id,
    kcId: "kc-market-structure",
    type: "mcq",
    difficulty,
    payload: { type: "mcq", question: id, options: ["a", "b"] },
    answerKey: { type: "mcq", correct: 0 },
    explanation: "",
    isPretestEligible: false,
  });

  it("shows the routing engine's own decision, value for value", () => {
    const sel = nextItem([item("e", "easy"), item("m", "med")], "kc-market-structure", 0.25, {
      usedItemIds: [],
      consecutiveWrong: 2,
    })!;
    render(<WhyPopover reason={sel.reason} />);
    const trigger = screen.getByRole("button", { name: "Why this question?" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Why this question" });
    const row = (label: string) => within(dialog).getByText(label).nextElementSibling!.textContent;
    expect(row("Current mastery estimate")).toBe(`${Math.round(sel.reason.pL * 100)}%`);
    expect(row("Band")).toBe(sel.reason.band);
    expect(row("Difficulty chosen")).toBe(sel.reason.difficulty);
    expect(row("Model predicts you answer correctly")).toBe(
      `${Math.round(sel.reason.pCorrectPredicted * 100)}%`,
    );
    // Two misses in a row: the panel has to say it is easing off.
    expect(within(dialog).getByText(/remediation/)).toBeTruthy();
  });

  it("closes on Escape", () => {
    const sel = nextItem([item("m", "med")], "kc-market-structure", 0.5, { usedItemIds: [], consecutiveWrong: 0 })!;
    render(<WhyPopover reason={sel.reason} />);
    fireEvent.click(screen.getByRole("button", { name: "Why this question?" }));
    expect(screen.queryByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Why this question?" }).getAttribute("aria-expanded")).toBe("false");
  });
});
