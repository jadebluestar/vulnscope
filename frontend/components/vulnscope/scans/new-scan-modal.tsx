"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useDashboard } from "@/lib/store/useDashboard";
import { useAuth } from "@/lib/store/useAuth";

interface NewScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "select-target" | "configure";

export function NewScanModal({ isOpen, onClose }: NewScanModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { targets, createScan, isLoadingScans } = useDashboard();
  const [step, setStep] = useState<Step>("select-target");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [selectedTools, setSelectedTools] = useState<string[]>([
    "nmap",
    "nikto",
    "sqlmap",
    "python-requests",
  ]);

  const activeTargets = targets.filter((t) => t.status === "active");

  const handleNext = () => {
    if (step === "select-target" && selectedTargetId) {
      setStep("configure");
    }
  };

  const handleBack = () => {
    if (step === "configure") {
      setStep("select-target");
    }
  };

  const handleCreateScan = async () => {
    if (!selectedTargetId || !user) return;
    const scan = await createScan(
      {
        targetId: selectedTargetId,
        tools: selectedTools,
        scanType: "full" as any,
        depth: 3 as any,
        includeExploitation: true,
      },
      user.id
    );
    onClose();
    router.push(`/dashboard/scans/${scan.id}/progress`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-amber-dim/60 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="font-display text-2xl tracking-wider text-primary">New Scan</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:text-primary">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${step === "select-target" ? "bg-amber text-bg-primary" : "bg-slate-800 text-primary"}`}>
            {step === "select-target" ? 1 : <Check size={16} />}
          </div>
          <span className="text-sm text-muted">Select Target</span>
          <div className="mx-2 h-px flex-1 bg-slate-700" />
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${step === "configure" ? "bg-amber text-bg-primary" : "bg-slate-800 text-primary"}`}>
            2
          </div>
          <span className="text-sm text-muted">Configure Scan</span>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === "select-target" && (
            <div className="space-y-4">
              <p className="text-sm text-muted">Choose an active target to scan. Only targets marked as <span className="text-amber">active</span> are available.</p>
              {activeTargets.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-6 text-center">
                  <p className="text-muted">No active targets found.</p>
                  <button onClick={() => { onClose(); router.push("/dashboard/targets"); }} className="mt-3 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary">
                    Add a Target
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {activeTargets.map((target) => (
                    <button key={target.id} onClick={() => setSelectedTargetId(target.id)} className={`flex items-center justify-between rounded-lg border p-4 text-left transition ${selectedTargetId === target.id ? "border-amber-dim bg-amber/10" : "border-slate-800 bg-slate-800/50 hover:border-amber-dim"}`}>
                      <div>
                        <p className="font-medium text-primary">{target.name}</p>
                        <p className="text-sm text-muted">{target.url || target.ipAddress}</p>
                      </div>
                      {selectedTargetId === target.id && <Check size={18} className="text-amber" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "configure" && selectedTargetId && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-primary">Target</label>
                <p className="mt-1 text-sm text-muted">{targets.find((t) => t.id === selectedTargetId)?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-primary">Tools to run</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["nmap", "nikto", "sqlmap", "python-requests"].map((tool) => (
                    <button key={tool} type="button" onClick={() => setSelectedTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool])} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${selectedTools.includes(tool) ? "bg-amber text-bg-primary" : "border border-slate-700 bg-slate-800 text-muted hover:bg-slate-700"}`}>
                      {tool.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
          <div>{step === "configure" && <button onClick={handleBack} className="flex items-center gap-1 rounded-full border border-slate-700 px-4 py-2 text-sm text-muted hover:text-primary"><ChevronLeft size={16} /> Back</button>}</div>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-muted hover:text-primary">Cancel</button>
            {step === "select-target" ? (
              <button onClick={handleNext} disabled={!selectedTargetId} className="flex items-center gap-1 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary disabled:opacity-50">Next <ChevronRight size={16} /></button>
            ) : (
              <button onClick={handleCreateScan} disabled={isLoadingScans || selectedTools.length === 0} className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary disabled:opacity-50">{isLoadingScans ? "Starting..." : "Start Scan"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}