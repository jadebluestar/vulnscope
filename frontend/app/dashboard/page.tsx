"use client";

import Link from "next/link";
import { AlertCircle, Check, FileText, Target, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboard } from "@/lib/store/useDashboard";

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className={`border px-6 py-6 ${accent}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        <div>{icon}</div>
      </div>
      <p className="mt-4 font-display text-5xl tracking-wide text-primary">{value}</p>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const { scans, stats, reports, targets, vulnerabilities } = useDashboard();
  const recentScans = scans.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Command Center</p>
        <h1 className="mt-2 font-display text-6xl tracking-wider text-primary">Dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Unified view of scans, findings, reports, and AI remediation across your active lab targets.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Active Scans"
          value={stats.activeScans}
          subtitle="Pipelines currently executing"
          icon={<Zap className="text-amber" />}
          accent="border-amber-dim bg-amber/10"
        />
        <StatCard
          title="Critical Findings"
          value={stats.criticalVulnerabilities}
          subtitle="Need immediate triage"
          icon={<AlertCircle className="text-red-300" />}
          accent="border-red-500/30 bg-red-500/10"
        />
        <StatCard
          title="Reports Generated"
          value={stats.reportsGenerated}
          subtitle="Ready for technical review"
          icon={<FileText className="text-cyan" />}
          accent="border-slate-800 bg-bg-secondary"
        />
        <StatCard
          title="AI Fixes Accepted"
          value={stats.aiFixesAccepted}
          subtitle={`${Math.round(stats.fixAcceptanceRate * 100)}% acceptance rate`}
          icon={<Check className="text-green-300" />}
          accent="border-green-500/30 bg-green-500/10"
        />
        <StatCard
          title="Registered Targets"
          value={targets.length}
          subtitle="Lab and staging systems in scope"
          icon={<Target className="text-amber" />}
          accent="border-slate-800 bg-bg-secondary"
        />
        <StatCard
          title="Average MTTR"
          value={`${(stats.mttrAverage / 60).toFixed(1)}h`}
          subtitle="Mean time to remediate"
          icon={<TrendingUp className="text-primary" />}
          accent="border-slate-800 bg-bg-secondary"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border border-slate-800 bg-bg-secondary px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Recent Scans</h2>
              <p className="mt-1 text-sm text-muted">Latest activity across active targets.</p>
            </div>
            <Link href="/dashboard/scans" className="text-sm text-amber hover:text-amber-glow">
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentScans.map((scan) => {
              const findings = vulnerabilities.filter((item) => item.scanId === scan.id).length;
              const target = targets.find((item) => item.id === scan.targetId);
              return (
                <div
                  key={scan.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-primary">{target?.name ?? "Unknown Target"}</p>
                    <p className="mt-1 text-sm text-muted">{target?.url}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize text-amber">{scan.status}</p>
                    <p className="mt-1 text-xs text-muted">{findings} findings</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border border-slate-800 bg-bg-secondary px-6 py-6">
          <h2 className="text-xl font-semibold text-primary">Quick Actions</h2>
          <p className="mt-1 text-sm text-muted">Jump to the workflows used most often.</p>
          <div className="mt-5 space-y-3">
            <Link href="/dashboard/scans?new=1" className="block rounded-2xl border border-amber-dim bg-amber/10 px-4 py-4 text-primary hover:bg-amber/15">
              Launch new scan
            </Link>
            <Link href="/dashboard/targets" className="block rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4 text-primary hover:border-amber-dim">
              Manage targets
            </Link>
            <Link href="/dashboard/findings" className="block rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4 text-primary hover:border-amber-dim">
              Review findings
            </Link>
            <Link href="/dashboard/reports" className="block rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4 text-primary hover:border-amber-dim">
              Open reports
            </Link>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4 text-sm text-muted">
            {reports.length} report(s) available and {vulnerabilities.filter((item) => item.aiFix && !item.aiFix.accepted).length} AI remediation suggestion(s) pending review.
          </div>
        </Card>
      </div>
    </div>
  );
}
