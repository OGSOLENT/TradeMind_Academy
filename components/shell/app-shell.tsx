import { GlassNav } from "./glass-nav";
import { TabBar } from "./tab-bar";
import { AmbientBackground } from "./ambient-background";
import { Toaster } from "@/components/ui/toast";

/**
 * The app shell: glass nav on desktop, bottom tab bar with the Practice FAB
 * on mobile. The inner wrapper carries data-drawer-scale so an open drawer
 * can push the whole page back to 0.97 and give the sheet some depth.
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
