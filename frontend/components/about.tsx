"use client";

import { motion } from "framer-motion";

export default function About() {
  const painCards = [
    {
      icon: "⚠",
      title: "Fragmented Outputs",
      text: "Nmap, Nikto, Burp Suite – each tool speaks its own format. No single view of the attack surface.",
    },
    {
      icon: "⏱",
      title: "Manual Reporting",
      text: "CVSS scoring and report writing are done by hand – slow, inconsistent, and error-prone.",
    },
    {
      icon: "🔗",
      title: "No Pipeline Visibility",
      text: "Students learn tools in isolation. The full recon → exploit → report chain is never connected.",
    },
    {
      icon: "✓",
      title: "VulnScope Fixes This",
      text: "One Python command chains all tools, parses outputs, and auto‑generates a structured PDF report.",
      isGreen: true,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <section id="about" className="bg-bg-secondary py-24 px-6" aria-labelledby="about-heading">
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-xs text-amber uppercase tracking-widest mb-3">
          PROBLEM STATEMENT
        </p>
        <h2
          id="about-heading"
          className="font-display text-5xl lg:text-6xl text-primary tracking-widest mb-14"
        >
          The Gap in Security Testing
        </h2>

        <div className="lg:grid lg:grid-cols-2 gap-14 items-start">
          {/* Left column – shortened text */}
          <motion.div
            className="space-y-4"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-muted font-body text-base leading-relaxed"
            >
              SQLi and XSS continue to dominate the OWASP Top 10 – not because tools are missing,
              but because no lightweight, student‑buildable framework ties them together into a
              single pipeline that also produces a professional report.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-muted font-body text-base leading-relaxed"
            >
              <span className="text-amber font-semibold">VulnScope</span> runs inside a VirtualBox
              lab (Kali Linux → DVWA + Metasploitable 2). All testing is safe, legal, and fully
              reproducible.
            </motion.p>
          </motion.div>

          {/* Right column – pain cards (unchanged) */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 lg:pt-0"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {painCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded p-5 ${
                  card.isGreen
                    ? "bg-amber/5 border border-amber-dim"
                    : "bg-surface border border-slate-600 hover:border-border-accent"
                } transition`}
              >
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3
                  className={`font-mono text-sm font-semibold ${
                    card.isGreen ? "text-amber" : "text-primary"
                  } uppercase tracking-wide mb-2`}
                >
                  {card.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">{card.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}