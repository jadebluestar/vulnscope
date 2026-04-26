"use client";

import { motion } from "framer-motion";
import { PIPELINE_STEPS } from "@/lib/pipeline-data";

export default function Pipeline() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section id="pipeline" className="bg-bg-primary py-24 px-6 relative" aria-labelledby="pipeline-heading">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(232,124,30,0.04)_0%,transparent_65%)]" />
      <div className="max-w-6xl mx-auto relative z-10">
        <p className="font-mono text-xs text-amber uppercase tracking-widest mb-3">ARCHITECTURE</p>
        <h2 id="pipeline-heading" className="font-display text-5xl lg:text-6xl text-primary tracking-widest mb-4">
          The Attack Pipeline
        </h2>
        <p className="text-muted text-base max-w-xl mb-14">
          Each stage feeds structured output into the next. The Python orchestrator transforms
          this from a collection of tool runs into a unified framework.
        </p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {PIPELINE_STEPS.map((step, i) => (
            <motion.div key={step.id} custom={i} variants={item} className="flex flex-col">
              <div
                className={`font-display text-5xl leading-none -mb-2 pl-1 ${
                  step.isFinal ? "text-amber-dim" : "text-border"
                }`}
              >
                {step.num}
              </div>

              {/* Card with h-full */}
              <div
                className={`rounded p-5 flex flex-col h-full ${
                  step.isFinal
                    ? "bg-amber/5 border border-amber-dim hover:border-amber hover:shadow-[0_0_24px_rgba(232,124,30,0.2)]"
                    : "bg-surface border border-slate-600 hover:border-amber-dim hover:-translate-y-1 hover:shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
                } transition-all`}
              >
                <div className="text-2xl mb-2.5">{step.icon}</div>
                <h3 className="font-mono text-sm font-semibold text-primary mb-2">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed flex-1">{step.description}</p>
                <div
                  className={`mt-3 font-mono text-xs ${
                    step.isFinal
                      ? "text-amber-glow bg-amber/12 font-semibold"
                      : "text-amber bg-amber/8"
                  } px-2.5 py-1 rounded border-l-2 border-amber inline-block w-fit`}
                >
                  {step.output}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="w-full"
        >
          <div className="bg-[#050709] border border-border-accent rounded px-6 py-4 font-mono text-sm text-cyan overflow-x-auto whitespace-nowrap border-l-4 border-l-amber">
            <span className="text-amber">$</span> python3 vulnscope.py --target 192.168.56.0/24 --output report.pdf
          </div>
        </motion.div>
      </div>
    </section>
  );
}