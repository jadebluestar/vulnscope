import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

export default function CTASection() {
  return (
    <section className="border-t border-slate-800 px-4 py-20" style={{ backgroundImage: "linear-gradient(to bottom, rgb(3,7,18), rgb(15,23,42))" }}>
      <div className="mx-auto max-w-4xl space-y-8 text-center">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-white md:text-5xl">Ready to Secure the Next Target?</h2>
          <p className="mx-auto max-w-2xl text-lg text-dimtext">
            Jump from the landing page into the protected dashboard, launch a new scan, and review the full assessment loop.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-4 pt-8 sm:flex-row">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber px-8 py-4 font-semibold text-bg-primary transition-colors hover:bg-amber-glow"
          >
            <Download className="h-5 w-5" />
            Create Lab Account
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-8 py-4 font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Open Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid gap-6 pt-8 sm:grid-cols-3">
          {[
            { title: "2 Minute Setup", description: "Register a mock account and start exploring immediately." },
            { title: "One Shared Data Layer", description: "Targets, scans, findings, and reports now stay in sync." },
            { title: "AI Review Loop", description: "Accept or reject remediation proposals directly in the UI." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-700 bg-slate-900/30 p-6">
              <h3 className="mb-2 font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-dimtext">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 text-sm text-dimtext">
          <p>
            VulnScope is designed for safe, legal, controlled educational environments and demo-ready portfolio review.
          </p>
        </div>
      </div>
    </section>
  );
}
