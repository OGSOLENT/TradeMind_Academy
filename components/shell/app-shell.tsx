import { GlassNav } from "./glass-nav";
import { TabBar } from "./tab-bar";
import { AmbientBackground } from "./ambient-background";
import { PageTransition } from "./page-transition";
import { Toaster } from "@/components/ui/toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-drawer-scale className="min-h-dvh origin-center">
      <AmbientBackground />
      <GlassNav />
      <main id="main" className="px-4 pb-28 pt-6 md:px-margin-safe md:pb-12 md:pt-[96px]">
        <PageTransition>{children}</PageTransition>
      </main>
      <TabBar />
      <Toaster />
    </div>
  );
}
