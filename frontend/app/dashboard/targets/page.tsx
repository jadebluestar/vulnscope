"use client";

import TargetTable from "@/components/vulnscope/targets/target-table";
import { useDashboard } from "@/lib/store/useDashboard";

export default function TargetsPage() {
  const { targets, addTarget, updateTarget, deleteTarget, isLoadingTargets } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Scope Registry</p>
        <h1 className="mt-2 font-display text-6xl tracking-wider text-primary">Targets</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Centralized inventory for every lab, staging, and experimental asset in the pipeline.
        </p>
      </div>

      <TargetTable
        targets={targets}
        onAddTarget={(target) => void addTarget(target)}
        onEditTarget={(id, updates) => void updateTarget(id, updates)}
        onDeleteTarget={(id) => void deleteTarget(id)}
        isLoading={isLoadingTargets}
      />
    </div>
  );
}
