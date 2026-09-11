"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";
import { useAuth } from "@/lib/firebase/auth-context";

/**
 * Applies the saved user settings to the document root:
 * - data-candles="colorblind" swaps --bull and --bear (globals.css)
 * - the font scale goes on <html>, so rem-based type scales everywhere
 * - data-motion="reduced" collapses CSS animation (globals.css). The framer
 *   components already respect prefers-reduced-motion via useReducedMotion.
 */
export function SettingsApplier() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: !!user,
    queryFn: () => getUserProfile(getFirebase().db, user!.uid),
  });

  useEffect(() => {
    const root = document.documentElement;
    const s = profile?.settings;
    root.dataset.candles = s?.colorBlindCandles ? "colorblind" : "";
    root.dataset.motion = s?.reducedMotion ? "reduced" : "";
    root.style.fontSize = s?.fontScale && s.fontScale !== 1 ? `${s.fontScale * 100}%` : "";
  }, [profile]);

  return null;
}
