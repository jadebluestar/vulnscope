"use client";

import Link from "next/link";
import { Download, Eye, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboard } from "@/lib/store/useDashboard";

export default function ReportsPage() {
  const { reports, scans, targets } = useDashboard();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Artifact Vault</p>
          <h1 className="mt-2 font-display text-6xl tracking-wider text-primary">Reports</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Review generated assessments, severity breakdowns, and detailed remediation context.
          </p>
        </div>

        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-amber-dim bg-amber/10 px-4 py-2 text-sm text-amber">
          <FileText size={16} />
          Mock PDF Ready
        </button>
      </div>

      <Card className="border border-slate-800 bg-bg-secondary px-0 py-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left text-sm text-muted">
                <th className="px-6 py-4">Report</th>
                <th className="px-6 py-4">Scan Type</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Severity Breakdown</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const scan = scans.find((item) => item.id === report.scanId);
                const target = targets.find((item) => item.id === report.targetId);

                return (
                  <tr key={report.id} className="border-b border-slate-900">
                    <td className="px-6 py-4">
                      <p className="font-medium text-primary">{report.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{scan?.toolsRunning.join(", ") ?? "pipeline"}</td>
                    <td className="px-6 py-4 text-sm text-muted">{target?.url}</td>
                    <td className="px-6 py-4 text-sm text-muted">{new Date(report.generatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {[
                          ["Critical", report.summary.critical, "text-red-300"],
                          ["High", report.summary.high, "text-orange-300"],
                          ["Medium", report.summary.medium, "text-yellow-300"],
                          ["Low", report.summary.low, "text-cyan"],
                        ].map(([label, value, color]) => (
                          <span
                            key={label}
                            className={`rounded-full border border-slate-800 bg-bg-primary px-2 py-1 text-xs ${color}`}
                          >
                            {value} {label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/reports/${report.scanId}`}
                          className="rounded-full border border-slate-700 p-2 text-muted hover:text-primary"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          type="button"
                          className="rounded-full border border-slate-700 p-2 text-muted hover:text-primary"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
