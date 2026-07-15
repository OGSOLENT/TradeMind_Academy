import type { Timestamp } from "firebase/firestore";

/** users/{uid} — BUILD_PROMPT §4. */
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
}

export const CONSENT_VERSION = "2026-07-15.v1";

export const defaultSettings: UserSettings = {
  theme: "dark",
  reducedMotion: false,
  colorBlindCandles: false,
  fontScale: 1,
};
