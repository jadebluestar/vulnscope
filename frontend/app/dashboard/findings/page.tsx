"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import FindingsDataTable from "@/components/vulnscope/findings/findings-data-table";
import { CVSSMeter } from "@/components/vulnscope/findings/cvss-meter";
import { SeverityBadge } from "@/components/vulnscope/findings/severity-badge";
import { useAuth } from "@/lib/store/useAuth";
import { useDashboard } from "@/lib/store/useDashboard";

export default function FindingsPage() {
  const { user } = useAuth();
  const { vulnerabilities, acceptAiFix, rejectAiFix } = useDashboard();
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const selectedFinding =
    vulnerabilities.find((item) => item.id === selectedFindingId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Triage Console</p>
        <h1 className="mt-2 font-display text-6xl tracking-wider text-primary">Findings</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Filter, sort, inspect evidence, and review AI-generated remediation proposals from one place.
        </p>
      </div>

      <FindingsDataTable
        findings={vulnerabilities}
        onViewDetails={(finding) => setSelectedFindingId(finding.id)}
      />

      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-slate-800 bg-bg-secondary px-8 py-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber">Finding Detail</p>
                <h2 className="mt-2 text-2xl font-semibold text-primary">{selectedFinding.title}</h2>
                <p className="mt-2 text-sm text-muted">{selectedFinding.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFindingId(null)}
                className="rounded-full border border-slate-700 px-3 py-2 text-sm text-muted hover:text-primary"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Severity</p>
                <div className="mt-3">
                  <SeverityBadge severity={selectedFinding.severity} size="md" showIcon={true} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">CVSS</p>
                <div className="mt-3">
                  <CVSSMeter score={selectedFinding.cvss} showLabel={true} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Status</p>
                <p className="mt-3 text-sm capitalize text-primary">{selectedFinding.status}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">OWASP</p>
                <p className="mt-3 text-sm text-primary">{selectedFinding.owasp.category}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Endpoint</p>
                <p className="mt-2 break-all font-mono text-sm text-primary">
                  <span className="text-amber">{selectedFinding.method ?? "GET"}</span> {selectedFinding.endpoint}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Impact</p>
                <p className="mt-2 text-sm text-muted">{selectedFinding.impact}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Remediation Guidance</p>
                <p className="mt-2 text-sm text-muted">{selectedFinding.remediation}</p>
              </div>

              {selectedFinding.aiFix?.codeSnippet && (
                <div className="rounded-2xl border border-amber-dim bg-amber/10 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-amber">AI Remediation</p>
                      <p className="mt-1 text-sm text-muted">{selectedFinding.aiFix.explanation}</p>
                    </div>
                    {selectedFinding.aiFix.accepted ? (
                      <div className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-green-300">
                        Accepted
                      </div>
                    ) : null}
                  </div>

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

                  {!selectedFinding.aiFix.accepted && (
                    <div className="mt-5 space-y-3">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => user && void acceptAiFix(selectedFinding.id, user.name)}
                          className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary"
                        >
                          Accept Fix
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            user &&
                            void rejectAiFix(selectedFinding.id, user.name, rejectionReason || undefined)
                          }
                          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-primary"
                        >
                          Reject Fix
                        </button>
                      </div>
                      <textarea
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        rows={3}
                        placeholder="Optional rejection reason"
                        className="w-full rounded-2xl border border-slate-700 bg-bg-primary px-4 py-3 text-sm text-white outline-none focus:border-amber"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
