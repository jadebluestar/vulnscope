"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, PauseCircle, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NewScanModal } from "@/components/vulnscope/scans/new-scan-modal";
import { useDashboard } from "@/lib/store/useDashboard";

export default function ScansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scans, targets, cancelScan } = useDashboard();
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const isModalOpen = scanModalOpen || searchParams.get("new") === "1";
  const handleCloseModal = () => {
    setScanModalOpen(false);
    if (searchParams.get("new") === "1") {
      router.replace("/dashboard/scans");
    }
  };

  const scanRows = useMemo(
    () =>
      scans.map((scan) => ({
        ...scan,
        target: targets.find((target) => target.id === scan.targetId),
      })),
    [scans, targets]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Execution Queue</p>
          <h1 className="mt-2 font-display text-6xl tracking-wider text-primary">Scans</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Launch new assessments, monitor live jobs, and jump directly into progress or report views.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setScanModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary"
        >
          <Plus size={16} />
          New Scan
        </button>
      </div>

      <Card className="border border-slate-800 bg-bg-secondary px-0 py-0">
        <div className="border-b border-slate-800 px-6 py-5">
          <h2 className="text-xl font-semibold text-primary">Recent Scans</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left text-sm text-muted">
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Started</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Findings</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scanRows.map((scan) => (
                <tr key={scan.id} className="border-b border-slate-900">
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary">{scan.target?.name ?? "Unknown Target"}</p>
                    <p className="mt-1 text-sm text-muted">{scan.target?.url ?? scan.targetId}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{scan.toolsRunning.join(", ")}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border border-amber-dim bg-amber/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber">
                      {scan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {new Date(scan.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-40 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-2 bg-amber" style={{ width: `${scan.progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{scan.progress}% complete</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-primary">{scan.findingsCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/scans/${scan.id}/progress`}
                        className="rounded-full border border-slate-700 p-2 text-muted hover:text-primary"
                      >
                        <Eye size={16} />
                      </Link>
                      {scan.status === "running" && (
                        <button
                          type="button"
                          onClick={() => void cancelScan(scan.id)}
                          className="rounded-full border border-slate-700 p-2 text-muted hover:text-primary"
                        >
                          <PauseCircle size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded-full border border-slate-700 p-2 text-muted hover:text-primary"
                        disabled
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <NewScanModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
