import { Download, Eye, FileText } from "lucide-react";

export default function ReportPreviewCard() {
  return (
    <section className="px-4 py-20" style={{ backgroundImage: "linear-gradient(to bottom, rgb(3,7,18), rgb(15,23,42))" }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-white md:text-5xl">Professional Security Reports</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dimtext">
            Executive summary, evidence, OWASP mapping, and AI-assisted remediation in one artifact.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900/50 shadow-2xl">
              <div className="border-b border-slate-700 bg-[linear-gradient(to_right,rgba(232,124,30,0.2),rgba(15,23,42,0.85))] p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-amber/10 p-3">
                    <FileText className="h-6 w-6 text-amber" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Security Audit Report</h3>
                    <p className="text-sm text-dimtext">Target: https://example.com</p>
                  </div>
                </div>
                <p className="text-sm text-dimtext">Generated on January 20, 2026 . Duration: 4m 32s</p>
              </div>

              <div className="space-y-6 p-8">
                <div>
                  <h4 className="mb-4 text-lg font-semibold text-white">Executive Summary</h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: "Critical", value: "2", color: "text-red-300" },
                      { label: "High", value: "3", color: "text-orange-300" },
                      { label: "Medium", value: "5", color: "text-yellow-300" },
                      { label: "Low", value: "4", color: "text-cyan" },
                    ].map((item) => (
                      <div key={item.label} className="rounded border border-slate-700 bg-slate-800/50 p-4">
                        <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                        <p className="mt-1 text-xs text-dimtext">{item.label} Issues</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 text-lg font-semibold text-white">Sample Finding</h4>
                  <div className="space-y-3 rounded border border-red-500/30 bg-red-900/10 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">SQL Injection in Login Form</p>
                      <span className="rounded border border-red-500/30 bg-red-900/50 px-2.5 py-1 text-xs font-semibold text-red-300">
                        Critical
                      </span>
                    </div>
                    <p className="text-sm text-dimtext">Database queries compromised through user input on the login endpoint.</p>
                    <div className="border-t border-red-500/20 pt-2">
                      <p className="mb-2 text-xs font-semibold text-dimtext">AI-Generated Fix</p>
                      <pre className="overflow-x-auto rounded bg-slate-950/50 p-2 text-xs text-green-300">
{`$stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
$stmt->bind_param("s", $_GET['email']);`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Report Includes</h3>
              <div className="space-y-3 text-sm text-dimtext">
                <p>Executive summary and severity charts</p>
                <p>Detailed findings with endpoint evidence</p>
                <p>AI remediation suggestions and code deltas</p>
                <p>OWASP mapping and traceable references</p>
                <p>Risk summary and remediation priorities</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-700 pt-4">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-4 py-3 font-semibold text-bg-primary transition-colors hover:bg-amber-glow">
                <Download className="h-4 w-4" />
                Download Sample PDF
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-700">
                <Eye className="h-4 w-4" />
                View Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
