// app/dashboard/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/useAuth";
import { useDashboard } from "@/lib/store/useDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { initialize, initialized } = useDashboard();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-bg-primary">
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <div className="flex justify-end p-4 border-b border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-sm text-muted hover:text-primary"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
          <main className="p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}