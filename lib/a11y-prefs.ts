"use client";

import { create } from "zustand";
import type { UserSettings } from "@/lib/firebase/types";
import { STORAGE_KEY } from "@/lib/a11y-boot";

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

export function useA11yPrefs(): A11yPrefs {
  return useA11y((s) => s.prefs);
}
