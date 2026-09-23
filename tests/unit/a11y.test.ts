import { afterEach, describe, expect, it } from "vitest";
import { PREFS_BOOT_SCRIPT, STORAGE_KEY } from "@/lib/a11y-boot";
import { applyPrefsToDocument, defaultPrefs, prefsFromSettings, useA11y, type A11yPrefs } from "@/lib/a11y-prefs";

/*
 * Accessibility preferences are applied twice: by an inline script that
 * runs before React (so a high-contrast learner never sees a flash of the
 * normal theme) and by applyPrefsToDocument once the app is running. The
 * two are separate copies of the same logic, and the source says "keep
 * this in step" by hand. This test makes that a check instead of a hope.
 */

const root = () => document.documentElement;

function snapshot() {
  const d = root().dataset;
  return {
    candles: d.candles || "",
    motion: d.motion || "",
    contrast: d.contrast || "",
    font: d.font || "",
    reading: d.reading || "",
    calm: d.calm || "",
    fontSize: root().style.fontSize,
  };
}

function clearRoot() {
  for (const k of ["candles", "motion", "contrast", "font", "reading", "calm"]) delete root().dataset[k];
  root().style.fontSize = "";
}

afterEach(() => {
  clearRoot();
  localStorage.clear();
});

const cases: A11yPrefs[] = [
  defaultPrefs,
  { ...defaultPrefs, highContrast: true, readableFont: true },
  { ...defaultPrefs, reducedMotion: true, calmMode: true, fontScale: 1.3 },
  { reducedMotion: true, colorBlindCandles: true, fontScale: 1.15, highContrast: true, readableFont: true, comfortableReading: true, calmMode: true },
];

describe("the pre-paint script and the runtime apply the same preferences", () => {
  it.each(cases.map((c, i) => [i, c] as const))("case %i", (_i, prefs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    new Function(PREFS_BOOT_SCRIPT)();
    const fromBoot = snapshot();
    clearRoot();
    applyPrefsToDocument(prefs);
    expect(snapshot()).toEqual(fromBoot);
  });

  it("the boot script survives missing or corrupt storage", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(() => new Function(PREFS_BOOT_SCRIPT)()).not.toThrow();
    expect(snapshot().contrast).toBe("");
  });
});

describe("prefsFromSettings", () => {
  it("falls back to the defaults for a profile without settings", () => {
    expect(prefsFromSettings(null)).toEqual(defaultPrefs);
    expect(prefsFromSettings(undefined)).toEqual(defaultPrefs);
  });

  it("maps a saved profile, treating settings added later as off", () => {
    const p = prefsFromSettings({ theme: "dark", reducedMotion: true, colorBlindCandles: false, fontScale: 1.15 });
    expect(p).toMatchObject({ reducedMotion: true, fontScale: 1.15, highContrast: false, calmMode: false });
  });
});

describe("the preferences store", () => {
  it("applies, persists and reads back", () => {
    const prefs = { ...defaultPrefs, highContrast: true, fontScale: 1.3 as const };
    useA11y.getState().set(prefs);
    expect(root().dataset.contrast).toBe("high");
    expect(root().style.fontSize).toBe("130%");
    useA11y.setState({ prefs: defaultPrefs, ready: false });
    useA11y.getState().hydrate();
    expect(useA11y.getState().prefs).toEqual(prefs);
    expect(useA11y.getState().ready).toBe(true);
  });

  it("hydrates to the defaults from corrupt storage", () => {
    localStorage.setItem(STORAGE_KEY, "{broken");
    useA11y.getState().hydrate();
    expect(useA11y.getState().prefs).toEqual(defaultPrefs);
  });
});
