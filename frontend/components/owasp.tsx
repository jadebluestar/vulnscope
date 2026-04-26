"use client";

export default function OWASP() {
  const covered = [
    { item: "A03 — Injection (SQLi via SQLMap + Burp Suite)" },
    { item: "A03 — XSS (Burp Suite manual payload injection)" },
    { item: "A05 — Security Misconfiguration (Nikto)" },
    { item: "A06 — Outdated Components (Nikto version checks)" },
    { item: "A07 — Missing Security Headers (Nikto CSP / HSTS)" },
  ];

  const partial = [
    { item: "A01 — Broken Access Control (DVWA difficulty levels)" },
    { item: "API Top 10 — Parameter Injection (Burp Intruder)" },
  ];

  return (
    <section
      id="owasp"
      className="bg-bg-secondary py-20 px-6"
      aria-labelledby="owasp-heading"
    >
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Column */}
        <div>
          <p className="font-mono text-xs text-amber uppercase tracking-widest mb-3">COVERAGE</p>
          <h2
            id="owasp-heading"
            className="font-display text-4xl text-primary tracking-widest mb-4"
          >
            OWASP Top 10 Coverage
          </h2>
          <p className="text-muted text-base">
            VulnScope targets the most critical web application security risks as classified by
            OWASP, using DVWA's configurable vulnerability levels as the test surface.
          </p>
        </div>

        {/* Right Column */}
        <div className="pt-6 lg:pt-0 flex flex-col gap-3">
          {covered.map((item, i) => (
            <div key={`covered-${i}`} className="flex items-start gap-3">
              <span className="font-mono text-sm font-bold w-5 shrink-0 text-green-500">✓</span>
              <span className="text-muted text-sm font-body">{item.item}</span>
            </div>
          ))}

          {partial.map((item, i) => (
            <div key={`partial-${i}`} className="flex items-start gap-3">
              <span className="font-mono text-sm font-bold w-5 shrink-0 text-amber">~</span>
              <span className="text-muted text-sm font-body">{item.item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
