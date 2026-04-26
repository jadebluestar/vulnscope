"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Home,
  Scan,
  Settings,
  Shield,
  Target,
  AlertTriangle,
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Scans", href: "/dashboard/scans", icon: Scan },
  { name: "Targets", href: "/dashboard/targets", icon: Target },
  { name: "Findings", href: "/dashboard/findings", icon: AlertTriangle },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-amber-dim/60 bg-bg-secondary/95 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Logo area */}
        <div className="flex h-16 items-center gap-2 border-b border-amber-dim/60 px-6">
          <Shield className="h-6 w-6 text-amber" />
          <span className="font-display text-xl tracking-widest text-primary">VulnScope</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber/10 text-amber"
                    : "text-muted hover:bg-surface hover:text-primary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / user info */}
        <div className="border-t border-amber-dim/60 p-4">
          <div className="rounded-lg bg-surface/50 p-3">
            <p className="text-xs text-muted">Lab Environment</p>
            <p className="text-xs text-amber">Isolated · Testing Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}