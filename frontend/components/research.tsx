"use client";

import { motion } from "framer-motion";
import { RESEARCH_DOMAINS } from "@/lib/research-data";

export default function Research() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section id="research" className="bg-bg-primary py-24 px-6" aria-labelledby="research-heading">
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-xs text-amber uppercase tracking-widest mb-3">LITERATURE SURVEY</p>
        <h2
          id="research-heading"
          className="font-display text-5xl lg:text-6xl text-primary tracking-widest mb-4"
        >
          Research‑Backed Decisions
        </h2>
        <p className="text-muted text-base max-w-lg mb-14">
          Four research domains directly shaped VulnScope’s design.
        </p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {RESEARCH_DOMAINS.map((domain) => (
            <motion.div
              key={domain.num}
              variants={item}
              className="bg-surface border border-slate-600 rounded p-6 flex flex-col gap-4 hover:border-border-accent transition"
            >
              <div className="font-display text-5xl text-amber/20 leading-none mb-1">{domain.num}</div>
              <h3 className="font-mono text-base font-semibold text-primary">{domain.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{domain.summary}</p>
              <div className="border-l-2 border-amber pl-4 bg-amber/4 py-3 pr-3 rounded-r">
                <p className="font-mono text-xs text-amber font-semibold mb-1">Design Impact →</p>
                <p className="text-muted text-sm leading-relaxed">{domain.designImpact}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {domain.refs.map((ref) => (
                  <span
                    key={ref.tag}
                    className="font-mono text-[0.65rem] text-dimtext bg-bg-secondary border border-slate-600 px-2 py-0.5 rounded"
                  >
                    {ref.tag} {ref.label}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}