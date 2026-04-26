"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Menu, LogOut, Settings, Shield, User, Zap } from "lucide-react";
import { useAuth } from "@/lib/store/useAuth";
import { useDashboard } from "@/lib/store/useDashboard";
import { NewScanModal } from "@/components/vulnscope/scans/new-scan-modal";

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { scans, vulnerabilities } = useDashboard();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const notifications = useMemo(
    () => [
      `${scans.filter((scan) => scan.status === "running").length} scan(s) currently active`,
      `${vulnerabilities.filter((item) => item.aiFix?.accepted).length} AI fix(es) accepted`,
    ],
    [scans, vulnerabilities]
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-amber-dim/50 bg-bg-primary/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-lg border border-slate-700 p-2 text-muted transition hover:text-primary md:hidden"
            >
              <Menu size={20} />
            </button>

            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-dim bg-amber/10 text-amber">
                <Shield size={18} />
              </div>
              <div>
                <p className="font-display text-3xl tracking-widest text-primary">VulnScope</p>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted">
                  Analyst Workspace
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScanModalOpen(true)}
              className="hidden items-center gap-2 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary transition hover:bg-amber-glow sm:inline-flex"
            >
              <Zap size={16} />
              New Scan
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((value) => !value)}
                className="relative rounded-lg border border-slate-700 p-2 text-muted transition hover:text-primary"
              >
                <Bell size={18} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-800 bg-surface p-4 shadow-2xl">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber">Notifications</p>
                  <div className="mt-3 space-y-2">
                    {notifications.map((message) => (
                      <div key={message} className="rounded-2xl border border-slate-800 bg-bg-primary px-3 py-3 text-sm text-muted">
                        {message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-3 rounded-full border border-slate-700 px-2 py-1.5 transition hover:border-amber-dim"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber/10 text-sm font-bold text-amber">
                  {user?.name.charAt(0) ?? "U"}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-primary">{user?.name ?? "Operator"}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{user?.role ?? "viewer"}</p>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-3xl border border-slate-800 bg-surface p-2 shadow-2xl">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-primary transition hover:bg-bg-primary"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm text-primary transition hover:bg-bg-primary"
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm text-red-300 transition hover:bg-bg-primary"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <NewScanModal isOpen={scanModalOpen} onClose={() => setScanModalOpen(false)} />
    </>
  );
}
