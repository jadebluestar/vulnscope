import type { ReactNode } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-bg-primary"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(232,124,30,0.08), transparent 30%), radial-gradient(circle at bottom right, rgba(245,147,66,0.05), transparent 25%), linear-gradient(to bottom right, rgb(8,10,12), rgb(13,16,20))",
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(36,51,64,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(36,51,64,0.25)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6">
          
        </header>

        {/* Remove the inner centering div – let the page handle its own layout */}
        <div className="flex-1">{children}</div>

        <footer className="px-6 pb-8 text-center text-sm text-dimtext">
          <p>Controlled access for the lab dashboard and reporting workspace.</p>
        </footer>
      </div>
    </div>
  );
}