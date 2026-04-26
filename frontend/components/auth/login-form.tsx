"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Lock, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/store/useAuth";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, isAuthenticated, hydrated, hydrateSession } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(searchParams.get("returnTo") ?? "/dashboard");
    }
  }, [hydrated, isAuthenticated, router, searchParams]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.password) newErrors.password = "Password required";
    else if (formData.password.length < 6) newErrors.password = "Minimum 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    if (!validate()) return;
    try {
      await login(formData.email, formData.password);
      setSuccess(true);
      setTimeout(() => {
        router.replace(searchParams.get("returnTo") ?? "/dashboard");
      }, 500);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Login failed" });
    }
  };

  return (
    <Card className="w-full max-w-md border border-amber-dim/60 bg-surface/95 px-8 py-8 shadow-xl">
      <div className="space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Operator Login</p>
          <h1 className="font-display text-5xl tracking-wider text-primary">Access Dashboard</h1>
          <p className="text-sm text-muted">Use your lab account to continue.</p>
        </div>

        {errors.general && (
          <div className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} /> {errors.general}
          </div>
        )}
        {success && (
          <div className="flex gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            <CheckCircle2 size={16} /> Login successful. Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-primary">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dimtext" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-bg-primary py-2.5 pl-10 pr-4 text-white focus:border-amber focus:ring-1 focus:ring-amber"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-primary">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dimtext" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-bg-primary py-2.5 pl-10 pr-4 text-white focus:border-amber focus:ring-1 focus:ring-amber"
                disabled={isLoading}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-amber py-2.5 font-semibold text-bg-primary transition hover:bg-amber-glow disabled:opacity-70"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4 text-center text-sm text-muted">
          Need an account?{" "}
          <Link href="/auth/register" className="font-medium text-amber hover:text-amber-glow">
            Create one
          </Link>
        </div>
      </div>
    </Card>
  );
}