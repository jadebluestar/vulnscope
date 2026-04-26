"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bug, FileText, Settings, Target, Zap } from "lucide-react";
import { useDashboard } from "@/lib/store/useDashboard";

export function Sidebar({
  isOpen = true,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { scans, vulnerabilities, reports } = useDashboard();

  const items = [
    { label: "Dashboard", href: "/dashboard", icon: <BarChart3 size={18} /> },
    { label: "Targets", href: "/dashboard/targets", icon: <Target size={18} /> },
    {
      label: "Scans",
      href: "/dashboard/scans",
      icon: <Zap size={18} />,
      badge: scans.filter((scan) => scan.status === "running").length,
    },
    {
      label: "Findings",
      href: "/dashboard/findings",
      icon: <Bug size={18} />,
      badge: vulnerabilities.filter((item) => item.status === "open").length,
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: <FileText size={18} />,
      badge: reports.length,
    },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
  ];

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 border-r border-slate-800 bg-bg-secondary transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="p-4">
        <div className="rounded-3xl border border-amber-dim/50 bg-amber/10 px-4 py-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-amber">Active Mode</p>
          <p className="mt-2 text-sm text-primary">Controlled lab assessment only</p>
        </div>

        <nav className="mt-4 space-y-2">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                    active
                      ? "border-amber-dim bg-amber/10 text-amber"
                      : "border-transparent text-muted hover:border-slate-800 hover:bg-bg-primary hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="rounded-full bg-bg-primary px-2 py-0.5 text-xs text-amber">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
