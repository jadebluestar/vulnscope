"use client";

import { Target } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  target: Target | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  target,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Delete Target?</h2>
          </div>
          <p className="text-sm text-dimtext">
            Are you sure you want to delete <span className="font-semibold text-white">"{target.name}"</span>? This action cannot be undone and all associated scan data will be lost.
          </p>
          <div className="p-3 bg-slate-800/50 rounded border border-slate-700 space-y-1.5">
            <p className="text-xs text-dimtext">URL: <span className="text-white font-mono text-xs">{target.url}</span></p>
            {target.ipAddress && <p className="text-xs text-dimtext">IP: <span className="text-white font-mono text-xs">{target.ipAddress}</span></p>}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => onConfirm(target.id)} disabled={isLoading}>{isLoading ? "Deleting..." : "Delete"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}