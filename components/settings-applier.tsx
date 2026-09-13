"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";
import { useAuth } from "@/lib/firebase/auth-context";
import { prefsFromSettings, useA11y } from "@/lib/a11y-prefs";

/**
 * Applies the saved user settings to the document root:
 * - data-candles="colorblind" swaps --bull and --bear (globals.css)
 * - the font scale goes on <html>, so rem-based type scales everywhere
 * - data-motion="reduced" collapses CSS animation (globals.css). The framer
 *   components already respect prefers-reduced-motion via useReducedMotion.
 * - data-contrast, data-font, data-reading and data-calm drive the newer
 *   modes (high contrast, the readable typeface, comfortable reading, and
 *   the calm mode that switches the decorative layers off)
 *
 * Everything goes through the a11y store, which also mirrors the applied
 * copy into localStorage so the next load can stamp the page before paint
 * and so the marketing and sign-in pages keep the learner's choices too.
 */
export function SettingsApplier() {
  const { user } = useAuth();
  const hydrate = useA11y((s) => s.hydrate);
  const set = useA11y((s) => s.set);
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: !!user,
    queryFn: () => getUserProfile(getFirebase().db, user!.uid),
  });

  // The stored copy first, so a signed-out page (or the second before the
  // profile arrives) already looks the way the learner left it.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!profile) return;
    set(prefsFromSettings(profile.settings));
  }, [profile, set]);

  return null;
}
