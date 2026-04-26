"use client";

import { useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AddTargetModal } from "./add-target-modal";
import EditTargetModal from "./edit-target-modal";
import DeleteConfirmationModal from "./delete-confirmation-modal";
import { Target } from "@/lib/types";

interface TargetTableProps {
  targets: Target[];
  onAddTarget: (target: Omit<Target, "id" | "createdAt" | "updatedAt">) => Promise<Target>;
  onEditTarget: (id: string, updates: Partial<Target>) => Promise<void>;
  onDeleteTarget: (id: string) => Promise<void>;
  isLoading: boolean;
}

export default function TargetTable({
  targets,
  onAddTarget,
  onEditTarget,
  onDeleteTarget,
  isLoading,
}: TargetTableProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<Target | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    await onDeleteTarget(id);
    setIsDeleting(false);
    setDeletingTarget(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Centralized inventory for every lab, staging, and experimental asset in the pipeline.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary"
          >
            <Plus size={16} />
            Add New Target
          </button>
        </div>

        <Card className="border border-slate-800 bg-bg-secondary px-0 py-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left text-sm text-muted">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">URL / IP</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Environment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody>
              {targets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted">
                    No targets added yet. Click "Add New Target" to get started.
                  </td>
                </tr>
              ) : (
                targets.map((target) => (
                  <tr key={target.id} className="border-b border-slate-900">
                    <td className="px-6 py-4 font-medium text-primary">{target.name}</td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {target.url || target.ipAddress || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted capitalize">{target.type}</td>
                    <td className="px-6 py-4 text-sm text-muted capitalize">{target.environment}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          target.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : target.status === "inactive"
                            ? "bg-slate-500/20 text-slate-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {target.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium ${
                          target.riskLevel === "critical"
                            ? "text-red-400"
                            : target.riskLevel === "high"
                            ? "text-orange-400"
                            : target.riskLevel === "medium"
                            ? "text-yellow-400"
                            : "text-blue-400"
                        }`}
                      >
                        {target.riskLevel?.toUpperCase() || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingTarget(target)}
                          className="rounded-full border border-slate-700 p-2 text-muted hover:text-primary"
                          disabled={isLoading}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingTarget(target)}
                          className="rounded-full border border-slate-700 p-2 text-muted hover:text-red-400"
                          disabled={isLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Modals */}
      <AddTargetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditTargetModal
        isOpen={!!editingTarget}
        target={editingTarget}
        onClose={() => setEditingTarget(null)}
        onEdit={onEditTarget}
        isLoading={isLoading}
      />
      <DeleteConfirmationModal
        isOpen={!!deletingTarget}
        target={deletingTarget}
        onClose={() => setDeletingTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}