import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { GITHUB_URL } from "@/lib/constants";

const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Research", href: "#research" },
];

export default function Footer() {
  return (
    <footer className="border-t border-amber-dim/60 bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-6 py-14">
        {/* Flex container for alignment */}
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Left section: Brand + description */}
          <div className="space-y-4 md:max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-dim bg-amber/10 text-amber">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-display text-3xl tracking-widest text-primary">VulnScope</p>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-muted">
                  Automated VAPT Research Pipeline
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Focused on safe, lab-contained penetration testing
              automation across DVWA, Metasploitable, and reproducible research targets.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-amber-dim bg-amber/10 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-amber">
                Lab Isolated . Testing Active
              </div>
              <div className="rounded-full border border-slate-700 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                2025-2026 Capstone
              </div>
            </div>
          </div>

          {/* Right section: Navigation links */}
          <div className="md:text-right">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber">Navigate</p>
            <div className="mt-4 flex flex-col gap-3">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-muted hover:text-primary">
                  {item.label}
                </Link>
              ))}
              <Link href="/dashboard" className="text-sm text-muted hover:text-primary">
                Dashboard
              </Link>
              <Link href="/auth/login" className="text-sm text-muted hover:text-primary">
                Login
              </Link>
              
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 border-t border-slate-800 pt-5 text-center text-sm text-dimtext">
          <p>Copyright 2026 VulnScope. Security research for controlled educational environments only.</p>
        </div>
      </div>
    </footer>
  );
}