"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/store/useAuth";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading, isAuthenticated, hydrated, hydrateSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(searchParams.get("returnTo") ?? "/dashboard");
    }
  }, [hydrated, isAuthenticated, router, searchParams]);

  const passwordStrength = () => {
    const pwd = formData.password;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score >= 5) return { label: "Strong", width: "100%", color: "bg-green-500" };
    if (score >= 4) return { label: "Good", width: "75%", color: "bg-amber" };
    if (score >= 3) return { label: "Fair", width: "50%", color: "bg-yellow-500" };
    return { label: "Weak", width: "25%", color: "bg-red-500" };
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (formData.name.trim().length < 2) newErrors.name = "Name too short";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    if (formData.password.length < 8) newErrors.password = "Minimum 8 characters";
    else if (passwordStrength().label === "Weak") newErrors.password = "Use upper, lower, number & special";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    if (!validate()) return;
    try {
      await register(formData.email, formData.password, formData.name);
      setSuccess(true);
      setTimeout(() => router.replace(searchParams.get("returnTo") ?? "/dashboard"), 500);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Registration failed" });
    }
  };

  const strength = passwordStrength();

  return (
    <Card className="w-full max-w-lg border border-amber-dim/60 bg-surface/95 px-8 py-8 shadow-xl">
      <div className="space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">New Operator</p>
          <h1 className="font-display text-5xl tracking-wider text-primary">Create Account</h1>
          <p className="text-sm text-muted">Register a mock lab account and access the dashboard.</p>
        </div>

        {errors.general && (
          <div className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} /> {errors.general}
          </div>
        )}
        {success && (
          <div className="flex gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            <CheckCircle2 size={16} /> Account created. Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-primary">Full Name</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dimtext" />
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-bg-primary py-2.5 pl-10 pr-4 text-white focus:border-amber focus:ring-1 focus:ring-amber"
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-primary">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dimtext" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-bg-primary py-2.5 pl-10 pr-4 text-white focus:border-amber focus:ring-1 focus:ring-amber"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-primary">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dimtext" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-bg-primary py-2.5 pl-10 pr-10 text-white focus:border-amber focus:ring-1 focus:ring-amber"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dimtext hover:text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className="text-xs text-muted">Strength: {strength.label}</p>
              </div>
            )}
            {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-primary">Confirm Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dimtext" />
              <input
                type={showConfirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-bg-primary py-2.5 pl-10 pr-10 text-white focus:border-amber focus:ring-1 focus:ring-amber"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dimtext hover:text-primary"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-300">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-amber py-2.5 font-semibold text-bg-primary transition hover:bg-amber-glow disabled:opacity-70"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-amber hover:text-amber-glow">
            Login here
          </Link>
        </div>
      </div>
    </Card>
  );
}