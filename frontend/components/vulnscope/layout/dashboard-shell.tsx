"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/vulnscope/layout/sidebar";
import { TopNav } from "@/components/vulnscope/layout/top-nav";
import { useAuth } from "@/lib/store/useAuth";
import { useDashboard } from "@/lib/store/useDashboard";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, hydrated, hydrateSession } = useAuth();
  const { initialize, initialized, isBootstrapping } = useDashboard();

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!isAuthenticated) {
      const query = searchParams.toString();
      const returnTo = query ? `${pathname}?${query}` : pathname;
      router.replace(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (!initialized) {
      void initialize();
    }
  }, [hydrated, initialize, initialized, isAuthenticated, pathname, router, searchParams]);

  if (!hydrated || !isAuthenticated || isBootstrapping) {
    return (
      <div className="min-h-screen bg-bg-primary text-primary flex items-center justify-center">
        <div className="rounded-2xl border border-amber-dim bg-surface px-8 py-6 text-center shadow-[0_0_40px_rgba(232,124,30,0.08)]">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">VulnScope</p>
          <h1 className="mt-3 font-display text-4xl tracking-wider text-primary">Loading Workspace</h1>
          <p className="mt-2 text-sm text-muted">Synchronizing session, targets, and reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <TopNav onMenuClick={() => setSidebarOpen((value) => !value)} />
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto md:ml-64">
          <div className="p-6 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
