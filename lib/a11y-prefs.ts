"use client";

import { create } from "zustand";
import type { UserSettings } from "@/lib/firebase/types";
import { STORAGE_KEY } from "@/lib/a11y-boot";

/**
 * The accessibility preferences, as applied to the page.
 *
 * The saved copy lives on the profile (users/{uid}.settings) so it follows
 * the learner between devices. But the profile only arrives after sign-in
 * and a Firestore read, and I don't want the page flashing bright, animated
 * and Inter for half a second before it settles into what the learner
 * asked for. So the applied preferences are mirrored into localStorage,
 * a tiny inline script in the root layout reads that copy and stamps the
 * html element before first paint, and this store is the in-app view of
 * the same thing. Components that switch things off (the 3D scenes, the
 * particles) read the store. The CSS reads the data attributes.
 */

export interface A11yPrefs {
  reducedMotion: boolean;
  colorBlindCandles: boolean;
  fontScale: 1 | 1.15 | 1.3;
  highContrast: boolean;
  readableFont: boolean;
  comfortableReading: boolean;
  calmMode: boolean;
}


export const defaultPrefs: A11yPrefs = {
  reducedMotion: false,
  colorBlindCandles: false,
  fontScale: 1,
  highContrast: false,
  readableFont: false,
  comfortableReading: false,
  calmMode: false,
};

export function prefsFromSettings(s: UserSettings | undefined | null): A11yPrefs {
  if (!s) return defaultPrefs;
  return {
    reducedMotion: !!s.reducedMotion,
    colorBlindCandles: !!s.colorBlindCandles,
    fontScale: s.fontScale ?? 1,
    highContrast: !!s.highContrast,
    readableFont: !!s.readableFont,
    comfortableReading: !!s.comfortableReading,
    calmMode: !!s.calmMode,
  };
}

function readStored(): A11yPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
    return { ...defaultPrefs, ...parsed };
  } catch {
    return defaultPrefs;
  }
}

/** Stamp the html element. Keep this in step with the inline script in app/layout.tsx. */
export function applyPrefsToDocument(p: A11yPrefs) {
  const root = document.documentElement;
  root.dataset.candles = p.colorBlindCandles ? "colorblind" : "";
  root.dataset.motion = p.reducedMotion ? "reduced" : "";
  root.dataset.contrast = p.highContrast ? "high" : "";
  root.dataset.font = p.readableFont ? "readable" : "";
  root.dataset.reading = p.comfortableReading ? "comfortable" : "";
  root.dataset.calm = p.calmMode ? "on" : "";
  root.style.fontSize = p.fontScale !== 1 ? `${p.fontScale * 100}%` : "";
}

interface A11yStore {
  prefs: A11yPrefs;
  /** True once the store has read localStorage on the client. */
  ready: boolean;
  set(prefs: A11yPrefs): void;
  hydrate(): void;
}

export const useA11y = create<A11yStore>((set) => ({
  prefs: defaultPrefs,
  ready: false,
  set(prefs) {
    set({ prefs, ready: true });
    applyPrefsToDocument(prefs);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Private mode or a full quota. The profile copy is the one that matters.
    }
  },
  hydrate() {
    set({ prefs: readStored(), ready: true });
  },
}));

/** The applied preferences. Safe to call anywhere on the client. */
export function useA11yPrefs(): A11yPrefs {
  return useA11y((s) => s.prefs);
}
