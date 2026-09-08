import { GlassNav } from "./glass-nav";
import { TabBar } from "./tab-bar";
import { AmbientBackground } from "./ambient-background";
import { Toaster } from "@/components/ui/toast";

/**
 * App shell: glass nav (desktop) + bottom tab bar with Practice FAB (mobile).
 * The inner wrapper carries data-drawer-scale so open drawers can push the
 * page back to 0.97 for depth.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-drawer-scale className="min-h-dvh origin-center">
      <AmbientBackground />
      <GlassNav />
      <main className="px-4 pb-24 pt-6 md:px-margin-safe md:pb-12 md:pt-[96px]">{children}</main>
      <TabBar />
      <Toaster />
    </div>
  );
}
