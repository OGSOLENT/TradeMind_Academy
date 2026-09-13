import type { Timestamp } from "firebase/firestore";

/** The users/{uid} document, per BUILD_PROMPT section 4. */
export interface UserProfile {
  displayName: string;
  createdAt: Timestamp;
  consent: { agreedAt: Timestamp; version: string } | null;
  isAdult: boolean;
  settings: UserSettings;
}

export interface UserSettings {
  theme: "dark";
  reducedMotion: boolean;
  colorBlindCandles: boolean;
  fontScale: 1 | 1.15 | 1.3;
  /** Brighter text, solid panels, stronger borders and underlined links. */
  highContrast?: boolean;
  /** Atkinson Hyperlegible instead of Inter, for low vision and dyslexia. */
  readableFont?: boolean;
  /** Looser line height and letter spacing in the lessons. */
  comfortableReading?: boolean;
  /** Turns off the ambient field, the particles and the 3D scenes. */
  calmMode?: boolean;
}

export const CONSENT_VERSION = "2026-07-15.v1";

export const defaultSettings: UserSettings = {
  theme: "dark",
  reducedMotion: false,
  colorBlindCandles: false,
  fontScale: 1,
  highContrast: false,
  readableFont: false,
  comfortableReading: false,
  calmMode: false,
};
