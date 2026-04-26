"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CVSSMeter } from "@/components/vulnscope/findings/cvss-meter";
import { SeverityBadge } from "@/components/vulnscope/findings/severity-badge";
import { useAuth } from "@/lib/store/useAuth";
import { useDashboard } from "@/lib/store/useDashboard";

export default function ReportDetailPage() {
  const params = useParams<{ scanId: string }>();
  const { user } = useAuth();
  const { reports, targets, acceptAiFix, rejectAiFix } = useDashboard();
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const scanId = params.scanId;
  const report = reports.find((item) => item.scanId === scanId);
  const target = targets.find((item) => item.id === report?.targetId);
  const findings = report?.findings ?? [];
  const selectedFinding = findings.find((item) => item.id === (selectedFindingId ?? findings[0]?.id)) ?? findings[0];
  const summaryText =
    !report || !target
      ? ""
      : `${report.title}\nTarget: ${target.url}\nTotal findings: ${report.summary.totalFindings}\nCritical: ${report.summary.critical}\nHigh: ${report.summary.high}\nAccepted fixes: ${report.summary.acceptedFixCount}`;

  if (!report || !target || !selectedFinding) {
    return <div className="text-sm text-muted">Report not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Assessment Report</p>
        <h1 className="mt-2 font-display text-6xl tracking-wider text-primary">{report.title}</h1>
        <p className="mt-3 text-sm text-muted">Scan ID: {scanId}</p>
      </div>

      <Card className="border border-amber-dim bg-amber/10 px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Target</p>
              <p className="mt-1 font-mono text-sm text-primary">{target.url}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Generated</p>
                <p className="mt-1 text-sm text-primary">{new Date(report.generatedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Accepted Fixes</p>
                <p className="mt-1 text-sm text-primary">{report.summary.acceptedFixCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              ["Total Findings", report.summary.totalFindings, "text-primary"],
              ["Critical", report.summary.critical, "text-red-300"],
              ["High", report.summary.high, "text-orange-300"],
              ["Exploitable", findings.filter((item) => item.exploitability === "high").length, "text-amber"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4 text-center">
                <p className={`font-display text-4xl tracking-wide ${color}`}>{value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-4">
          <button type="button" className="rounded-full bg-bg-primary px-4 py-2 text-sm text-primary">
            <Download className="mr-2 inline h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(summaryText)}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-primary"
          >
            <Copy className="mr-2 inline h-4 w-4" />
            Copy Summary
          </button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {findings.map((finding) => (
            <button
              key={finding.id}
              type="button"
              onClick={() => setSelectedFindingId(finding.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedFinding.id === finding.id
                  ? "border-amber-dim bg-amber/10"
                  : "border-slate-800 bg-bg-secondary hover:border-amber-dim"
              }`}
            >
              <SeverityBadge severity={finding.severity} size="sm" showIcon={true} />
              <p className="mt-3 font-medium text-primary">{finding.title}</p>
              <p className="mt-1 text-xs text-muted">{finding.endpoint}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="border border-slate-800 bg-bg-secondary px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-primary">{selectedFinding.title}</h2>
                <p className="mt-2 text-sm text-muted">{selectedFinding.description}</p>
              </div>
              <SeverityBadge severity={selectedFinding.severity} size="md" showIcon={true} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">CVSS</p>
                <div className="mt-2">
                  <CVSSMeter score={selectedFinding.cvss} showLabel={true} />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Endpoint</p>
                <p className="mt-2 break-all font-mono text-sm text-primary">{selectedFinding.endpoint}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Discovered By</p>
                <p className="mt-2 text-sm text-primary">{selectedFinding.discoveredBy}</p>
              </div>
            </div>
          </Card>

          {selectedFinding.aiFix?.codeSnippet && (
            <Card className="border border-amber-dim bg-amber/10 px-6 py-6">
              <p className="text-xs uppercase tracking-[0.2em] text-amber">AI-Generated Fix</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-red-300">Before</p>
                  <pre className="overflow-x-auto rounded-2xl border border-red-500/20 bg-[#111316] p-4 text-xs text-red-200">
                    <code>{selectedFinding.aiFix.codeSnippet.before}</code>
                  </pre>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-green-300">After</p>
                  <pre className="overflow-x-auto rounded-2xl border border-green-500/20 bg-[#111316] p-4 text-xs text-green-200">
                    <code>{selectedFinding.aiFix.codeSnippet.after}</code>
                  </pre>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted">{selectedFinding.aiFix.suggestion}</p>

              {selectedFinding.aiFix.accepted ? (
                <div className="mt-4 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
                  Accepted by {selectedFinding.aiFix.acceptedBy} on{" "}
                  {selectedFinding.aiFix.acceptedAt?.toLocaleString()}
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => user && void acceptAiFix(selectedFinding.id, user.name)}
                    className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary"
                  >
                    Accept Fix
                  </button>
                  <button
                    type="button"
                    onClick={() => user && void rejectAiFix(selectedFinding.id, user.name)}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm text-primary"
                  >
                    Reject Fix
                  </button>
                </div>
              )}
            </Card>
          )}

          <Card className="border border-slate-800 bg-bg-secondary px-6 py-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Detection Evidence</p>
            <div className="mt-4 space-y-3">
              {selectedFinding.evidence.map((evidence, index) => (
                <div key={`${evidence.tool}-${index}`} className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber">{evidence.type}</p>
                  <pre className="mt-2 overflow-x-auto text-xs text-muted">{evidence.content}</pre>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
