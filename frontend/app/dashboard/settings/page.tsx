"use client";

import { useState } from "react";
import { Bell, Database, Save, Shield, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/store/useAuth";
import { useDashboard } from "@/lib/store/useDashboard";

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, updateSettings, isSavingSettings } = useDashboard();
  const [localSettings, setLocalSettings] = useState(settings);

  const toggle = (key: keyof typeof localSettings) => {
    setLocalSettings((state) => ({ ...state, [key]: !state[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Workspace Preferences</p>
          <h1 className="mt-2 font-display text-6xl tracking-wider text-primary">Settings</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Mock persistence for notifications, security preferences, and report retention settings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void updateSettings(localSettings)}
          className="inline-flex items-center gap-2 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary"
        >
          <Save size={16} />
          {isSavingSettings ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-800 bg-bg-secondary px-6 py-6">
          <div className="flex items-center gap-3">
            <Bell className="text-amber" />
            <h2 className="text-xl font-semibold text-primary">Notifications</h2>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ["notifications", "Email Notifications"],
              ["autoScan", "Auto-start follow-up scan"],
              ["emailReports", "Send report exports by email"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-bg-primary px-4 py-3">
                <span className="text-sm text-primary">{label}</span>
                <input
                  type="checkbox"
                  checked={localSettings[key as keyof typeof localSettings] as boolean}
                  onChange={() => toggle(key as keyof typeof localSettings)}
                  className="h-4 w-4 accent-amber"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card className="border border-slate-800 bg-bg-secondary px-6 py-6">
          <div className="flex items-center gap-3">
            <Shield className="text-amber" />
            <h2 className="text-xl font-semibold text-primary">Security</h2>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ["twoFactor", "Two-factor authentication"],
              ["darkMode", "Dark mode lock"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-bg-primary px-4 py-3">
                <span className="text-sm text-primary">{label}</span>
                <input
                  type="checkbox"
                  checked={localSettings[key as keyof typeof localSettings] as boolean}
                  onChange={() => toggle(key as keyof typeof localSettings)}
                  className="h-4 w-4 accent-amber"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card className="border border-slate-800 bg-bg-secondary px-6 py-6">
          <div className="flex items-center gap-3">
            <Database className="text-amber" />
            <h2 className="text-xl font-semibold text-primary">Data Management</h2>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
            <label className="text-sm text-primary">Data Retention</label>
            <select
              value={localSettings.dataRetention}
              onChange={(event) =>
                setLocalSettings((state) => ({ ...state, dataRetention: Number(event.target.value) }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-bg-secondary px-4 py-3 text-sm text-primary outline-none focus:border-amber"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
              <option value={0}>Forever</option>
            </select>
          </div>
        </Card>

        <Card className="border border-slate-800 bg-bg-secondary px-6 py-6">
          <div className="flex items-center gap-3">
            <User className="text-amber" />
            <h2 className="text-xl font-semibold text-primary">Account</h2>
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Name</p>
              <p className="mt-2 text-sm text-primary">{user?.name}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-bg-primary px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Email</p>
              <p className="mt-2 text-sm text-primary">{user?.email}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
