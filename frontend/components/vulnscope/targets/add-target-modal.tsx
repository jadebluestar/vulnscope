"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useDashboard } from "@/lib/store/useDashboard";

interface AddTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTargetModal({ isOpen, onClose }: AddTargetModalProps) {
  const { addTarget, isLoadingTargets } = useDashboard();
  const [formData, setFormData] = useState({
    name: "",
    type: "url" as "url" | "ip" | "dvwa" | "metasploitable",
    url: "",
    ipAddress: "",
    port: "",
    environment: "lab" as "lab" | "staging" | "development" | "production",
    status: "active" as "active" | "inactive" | "unreachable",
    riskLevel: "medium" as "critical" | "high" | "medium" | "low",
    tags: "",
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetData: any = {
      name: formData.name,
      type: formData.type,
      environment: formData.environment,
      status: formData.status,
      riskLevel: formData.riskLevel,
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    if (formData.type === "url" || formData.type === "dvwa" || formData.type === "metasploitable") {
      targetData.url = formData.url;
    } else if (formData.type === "ip") {
      targetData.ipAddress = formData.ipAddress;
      if (formData.port) targetData.port = parseInt(formData.port);
    }

    // Add credentials if provided
    if (formData.username) {
      targetData.credentials = {
        username: formData.username,
        password: formData.password,
        authType: "basic",
      };
    }

    await addTarget(targetData);
    onClose();
    // Reset form
    setFormData({
      name: "",
      type: "url",
      url: "",
      ipAddress: "",
      port: "",
      environment: "lab",
      status: "active",
      riskLevel: "medium",
      tags: "",
      username: "",
      password: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-amber-dim/60 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="font-display text-2xl tracking-wider text-primary">Add New Target</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:text-primary"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-primary">Target Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber"
                placeholder="My Web App" />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary">Target Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber">
                <option value="url">URL / Domain</option>
                <option value="ip">IP Address</option>
                <option value="dvwa">DVWA Lab</option>
                <option value="metasploitable">Metasploitable</option>
              </select>
            </div>

            {(formData.type === "url" || formData.type === "dvwa" || formData.type === "metasploitable") && (
              <div>
                <label className="block text-sm font-medium text-primary">URL / Hostname *</label>
                <input type="text" required value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber"
                  placeholder="https://example.com" />
              </div>
            )}

            {formData.type === "ip" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-primary">IP Address *</label>
                  <input type="text" required value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber"
                    placeholder="192.168.1.100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary">Port</label>
                  <input type="number" value={formData.port} onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber"
                    placeholder="80" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-primary">Environment *</label>
              <select value={formData.environment} onChange={(e) => setFormData({ ...formData, environment: e.target.value as any })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber">
                <option value="lab">Lab</option><option value="staging">Staging</option><option value="development">Development</option><option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary">Status *</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber">
                <option value="active">Active</option><option value="inactive">Inactive</option><option value="unreachable">Unreachable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary">Risk Level</label>
              <select value={formData.riskLevel} onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber">
                <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-primary">Tags (comma separated)</label>
              <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber"
                placeholder="web, api, production" />
            </div>

            {/* Authentication (Optional) */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-800">
              <p className="text-xs font-medium text-dimtext mb-3">Authentication (Optional)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Username" className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber" />
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password" className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-amber focus:ring-1 focus:ring-amber" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-6">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-muted hover:text-primary">Cancel</button>
            <button type="submit" disabled={isLoadingTargets}
              className="flex items-center gap-2 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary hover:bg-amber-glow disabled:opacity-50">
              <Plus size={16} /> {isLoadingTargets ? "Adding..." : "Add Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}