/**
 * Shows only when a *development* build is pointed at the live Firebase
 * project (npm run dev:live). Production builds for participants never render
 * it, and the emulator never renders it, so its presence is unambiguous:
 * whatever you do on this screen is going into the real database.
 */
export function LiveBadge() {
  const isDev = process.env.NODE_ENV === "development";
  const onEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
  if (!isDev || onEmulator) return null;
  return (
    <div
      role="status"
      className="border-warning/40 bg-warning/15 pointer-events-none fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-full border px-3 py-1 text-xs font-medium text-warning backdrop-blur"
    >
      Live project: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}. Real data.
    </div>
  );
}
