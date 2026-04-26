"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Circle, Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboard } from "@/lib/store/useDashboard";
import { dashboardApi } from "@/lib/api";

export default function ScanProgressPage() {
  const params = useParams<{ scanId: string }>();
  const scanId = params.scanId;
  const { scans, getPipeline, updatePipeline, cancelScan } = useDashboard();
  const [expandedStage, setExpandedStage] = useState<string>("");
  const scan = scans.find((item) => item.id === scanId);

  // Stable selector – avoids returning a new array on every render
  const pipelineFromStore = useDashboard((state) => state.pipelineByScanId[scanId]);
  const pipeline = useMemo(() => pipelineFromStore ?? [], [pipelineFromStore]);

  // Load pipeline once on mount
  useEffect(() => {
    let isMounted = true;
    getPipeline(scanId).then((stages) => {
      if (isMounted) {
        const runningStage = stages.find((stage) => stage.status === "running");
        setExpandedStage(runningStage?.id ?? stages[0]?.id ?? "");
      }
    });
    return () => { isMounted = false; };
  }, [getPipeline, scanId]);

  // Polling – only depends on scanId and scan status, not on expandedStage
  useEffect(() => {
    if (!scan || scan.status !== 'running') return;

    let intervalId: NodeJS.Timeout;
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;
      try {
        const stages = await dashboardApi.getPipeline(scanId);
        await updatePipeline(scanId, stages);
        // Update expanded stage only if needed – but do not cause re‑polling
        const runningStage = stages.find(s => s.status === 'running');
        if (runningStage && runningStage.id !== expandedStage) {
          setExpandedStage(runningStage.id);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    intervalId = setInterval(poll, 3000);
    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [scanId, scan?.status, updatePipeline]); // Remove expandedStage from deps

  const totalProgress = useMemo(() => {
    if (!pipeline.length) return 0;
    return Math.round((pipeline.filter((stage) => stage.status === "completed").length / pipeline.length) * 100);
  }, [pipeline]);

  if (!scan) {
    return <div className="text-sm text-muted">Scan not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Pipeline Monitor</p>
        <h1 className="mt-2 font-display text-6xl tracking-wider text-primary">Scan Progress</h1>
        <p className="mt-3 text-sm text-muted">Scan ID: {scanId}</p>
      </div>

      <div className="border border-amber-dim bg-amber/10 px-6 py-6 rounded-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary">Overall progress</p>
            <p className="font-display text-5xl tracking-wide text-amber">{totalProgress}%</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-amber transition-all" style={{ width: `${totalProgress}%` }} />
          </div>
          <div className="flex gap-6 text-sm text-muted">
            <p>Completed: {pipeline.filter((stage) => stage.status === "completed").length}</p>
            <p>Running: {pipeline.filter((stage) => stage.status === "running").length}</p>
            <p>Pending: {pipeline.filter((stage) => stage.status === "pending").length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {pipeline.map((stage, index) => (
          <div key={stage.id}>
            <button
              type="button"
              onClick={() => setExpandedStage((current) => (current === stage.id ? "" : stage.id))}
              className="w-full text-left"
            >
              <div className="border border-slate-800 bg-bg-secondary px-5 py-5 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    {stage.status === "completed" ? (
                      <CheckCircle className="text-green-300" />
                    ) : stage.status === "running" ? (
                      <Loader className="animate-spin text-amber" />
                    ) : (
                      <Circle className="text-muted" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">
                      {index + 1}. {stage.name}
                    </p>
                    <p className="mt-1 text-sm text-muted">{stage.description}</p>
                  </div>
                  <div className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted">
                    {stage.status}
                  </div>
                </div>
              </div>
            </button>

            {expandedStage === stage.id && stage.logs.length > 0 && (
              <div className="rounded-b-lg border border-slate-800 border-t-0 bg-bg-primary px-5 py-4">
                <div className="space-y-2 font-mono text-xs text-muted">
                  {stage.logs.map((log, logIndex) => (
                    <p key={`${stage.id}-${logIndex}`}>{log}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => cancelScan(scanId)}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-primary"
        >
          Cancel Scan
        </button>
        {totalProgress === 100 && (
          <Link
            href={`/dashboard/reports/${scanId}`}
            className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary"
          >
            View Full Report
          </Link>
        )}
      </div>
    </div>
  );
}