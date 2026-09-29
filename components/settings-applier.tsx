"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";
import { useAuth } from "@/lib/firebase/auth-context";
import { prefsFromSettings, useA11y } from "@/lib/a11y-prefs";

export function SettingsApplier() {
  const { user } = useAuth();
  const hydrate = useA11y((s) => s.hydrate);
  const set = useA11y((s) => s.set);
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: !!user,
    queryFn: () => getUserProfile(getFirebase().db, user!.uid),
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!profile) return;
    set(prefsFromSettings(profile.settings));
  }, [profile, set]);

  return null;
}
