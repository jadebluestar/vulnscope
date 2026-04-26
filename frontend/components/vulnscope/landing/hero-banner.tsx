import { ArrowDown, Download } from "lucide-react";
import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-amber/10 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-cyan/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl space-y-8 text-center">
        <div className="inline-block">
          <span className="rounded-full border border-amber-dim bg-amber/10 px-4 py-2 text-sm font-medium text-amber">
            Productized workflow for fast lab scans
          </span>
        </div>

        <div className="space-y-4">
          <h2 className="text-5xl font-bold leading-tight text-white md:text-7xl">
            Paste URL
            <br />
            <span
              style={{
                backgroundImage: "linear-gradient(to right, rgb(232,124,30), rgb(29,233,200))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Get AI Fixes
            </span>
            <br />
            in Minutes
          </h2>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-dimtext">
            VulnScope turns the academic scanning pipeline into a polished operator experience with
            fast reports, actionable findings, and reviewable remediation suggestions.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-4 pt-8 sm:flex-row">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-lg bg-amber px-8 py-4 font-semibold text-bg-primary transition-colors hover:bg-amber-glow"
          >
            <Download className="h-5 w-5" />
            Open Dashboard
          </Link>
          <Link
            href="/dashboard/scans?new=1"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-8 py-4 font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Try Demo Scan
          </Link>
        </div>

        <div className="inline-flex animate-bounce flex-col items-center gap-2 pt-12 text-dimtext">
          <span className="text-sm">Scroll to explore</span>
          <ArrowDown className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
}
