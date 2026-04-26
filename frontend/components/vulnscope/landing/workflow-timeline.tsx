import { Brain, CheckCircle, FileText, Radar, Search, Zap } from "lucide-react";

const steps = [
  { icon: Zap, title: "Paste URL", description: "Share any URL, IP, or domain in the console.", color: "text-amber" },
  { icon: Radar, title: "Tools Run", description: "Nmap, Nikto, SQLMap, and custom checks execute.", color: "text-cyan" },
  { icon: Search, title: "Findings Detected", description: "Discovered vulnerabilities are classified and ranked.", color: "text-orange-300" },
  { icon: Brain, title: "AI Correlates", description: "AI groups evidence and drafts remediation guidance.", color: "text-amber-glow" },
  { icon: FileText, title: "Fix Code Generated", description: "Developer-ready suggestions are attached to findings.", color: "text-primary" },
  { icon: CheckCircle, title: "PDF Report", description: "A shareable report is ready for review.", color: "text-green-300" },
];

export default function WorkflowTimeline() {
  return (
    <section className="px-4 py-20" style={{ backgroundImage: "linear-gradient(to bottom, rgb(3,7,18), rgb(15,23,42), rgb(3,7,18))" }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-white md:text-5xl">The VulnScope Pipeline</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dimtext">
            From URL to technical report, the dashboard mirrors the same multi-stage research workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="group relative cursor-pointer rounded-lg border border-slate-700 bg-slate-900/50 p-6 transition-all hover:bg-slate-900/80">
                <div className="absolute -left-4 -top-4 flex h-9 w-9 items-center justify-center rounded-full bg-amber text-sm font-bold text-bg-primary">
                  {index + 1}
                </div>
                <div className={`mb-4 inline-block rounded-lg bg-slate-800 p-3 ${step.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-dimtext">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-dim bg-amber/10 px-6 py-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
            <span className="text-sm font-medium text-white">Pipeline available throughout the lab demo</span>
          </div>
        </div>
      </div>
    </section>
  );
}
