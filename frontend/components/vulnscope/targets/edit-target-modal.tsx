/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { Target, TargetType, EnvironmentLabel, TargetStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface EditTargetModalProps {
  isOpen: boolean;
  target: Target | null;
  onClose: () => void;
  onEdit: (id: string, updates: Partial<Target>) => void;
  isLoading?: boolean;
}

const targetTypes: TargetType[] = ["url", "ip", "domain", "dvwa", "metasploitable"];
const environments: EnvironmentLabel[] = ["production", "staging", "development", "lab"];
const riskLevels = ["critical", "high", "medium", "low"] as const;

export default function EditTargetModal({
  isOpen,
  target,
  onClose,
  onEdit,
  isLoading = false,
}: EditTargetModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "url" as TargetType,
    url: "",
    ipAddress: "",
    port: "",
    tags: "",
    environment: "development" as EnvironmentLabel,
    status: "active" as TargetStatus,
    riskLevel: "medium" as "critical" | "high" | "medium" | "low",
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (target && isOpen) {
      setFormData({
        name: target.name,
        type: target.type,
        url: target.url,
        ipAddress: target.ipAddress || "",
        port: target.port ? String(target.port) : "",
        tags: target.tags.join(", "),
        environment: target.environment,
        status: target.status,
        riskLevel: target.riskLevel,
        username: target.credentials?.username || "",
        password: target.credentials?.password || "",
      });
      setErrors({});
    }
  }, [target, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Target name is required";
    if (!formData.url.trim()) newErrors.url = "URL is required";
    if (formData.type === "ip" && formData.ipAddress && !/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ipAddress)) newErrors.ipAddress = "Invalid IP address";
    if (formData.port && isNaN(Number(formData.port))) newErrors.port = "Port must be a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !target) return;
    const tagsArray = formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag);
    const updates: Partial<Target> = {
      name: formData.name,
      type: formData.type,
      url: formData.url,
      environment: formData.environment,
      status: formData.status as "active" | "inactive" | "unreachable",
      riskLevel: formData.riskLevel,
      tags: tagsArray,
    };
    if (formData.type === "ip") {
      updates.ipAddress = formData.ipAddress || undefined;
      updates.port = formData.port ? Number(formData.port) : undefined;
    }
    if (formData.username) {
      updates.credentials = { username: formData.username, password: formData.password, authType: "basic" };
    }
    onEdit(target.id, updates);
    onClose();
  };

  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-white">Edit Target</h2>
          <button onClick={onClose} className="text-dimtext hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Target Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading} />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Target Type *</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading}>
              {targetTypes.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">URL/Hostname *</label>
            <input type="text" name="url" value={formData.url} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading} />
            {errors.url && <p className="text-xs text-red-400">{errors.url}</p>}
          </div>

          {/* Only show IP/Port fields when type is "ip" */}
          {formData.type === "ip" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">IP Address</label>
                <input type="text" name="ipAddress" value={formData.ipAddress} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading} />
                {errors.ipAddress && <p className="text-xs text-red-400">{errors.ipAddress}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">Port</label>
                <input type="text" name="port" value={formData.port} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading} />
                {errors.port && <p className="text-xs text-red-400">{errors.port}</p>}
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Environment *</label>
            <select name="environment" value={formData.environment} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading}>
              {environments.map(env => <option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Status *</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading}>
              <option value="active">Active</option><option value="inactive">Inactive</option><option value="unreachable">Unreachable</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Risk Level *</label>
            <select name="riskLevel" value={formData.riskLevel} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading}>
              {riskLevels.map(level => <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Tags (comma-separated)</label>
            <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading} />
          </div>

          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs font-medium text-dimtext mb-3">Authentication (Optional)</p>
            <div className="space-y-3">
              <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading} />
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber" disabled={isLoading} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-amber hover:bg-amber-glow text-bg-primary" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}