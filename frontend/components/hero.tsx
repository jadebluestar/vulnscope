"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import TerminalDemo from "./terminal-demo";

export default function Hero() {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMouseX(e.clientX);
    setMouseY(e.clientY);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const stats = [
    { num: "6+", label: "Tools Integrated" },
    { num: "13", label: "References Cited" },
    { num: "1", label: "Command to Run" },
    { num: "PDF", label: "Auto-Generated Report" },
  ];

  return (
    <section
      id="hero"
      className="min-h-screen bg-bg-primary pt-32 pb-20 px-6 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(30, 45, 56, 0.05) 25%, rgba(30, 45, 56, 0.05) 26%, transparent 27%, transparent 74%, rgba(30, 45, 56, 0.05) 75%, rgba(30, 45, 56, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(30, 45, 56, 0.05) 25%, rgba(30, 45, 56, 0.05) 26%, transparent 27%, transparent 74%, rgba(30, 45, 56, 0.05) 75%, rgba(30, 45, 56, 0.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(232,124,30,0.03)_0%,transparent_50%)]" />

      {/* Cursor glow */}
      <div
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle at center, rgba(232, 124, 30, 0.08) 0%, transparent 70%)`,
          left: `${mouseX}px`,
          top: `${mouseY}px`,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Content */}
      <motion.div
        className="max-w-4xl mx-auto flex flex-col items-center gap-6 text-center relative z-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div
          variants={item}
          className="border border-border-accent bg-surface rounded-full px-4 py-1.5 flex items-center gap-2"
        >
        
        </motion.div>

        {/* Title */}
        <motion.div variants={item} className="space-y-1">
          <h1 className="font-display text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[8.5rem] leading-none tracking-widest text-primary">
            AUTOMATED
          </h1>
          <h1
            className="font-display text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[8.5rem] leading-none tracking-widest text-amber"
            style={{
              textShadow:
                "0 0 20px rgba(232, 124, 30, 0.3), 0 0 40px rgba(232, 124, 30, 0.15)",
            }}
          >
            WEB APP
          </h1>
          <h1 className="font-display text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[8.5rem] leading-none tracking-widest text-primary">
            PEN TESTING
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={item}
          className="max-w-xl text-muted text-base leading-relaxed font-body"
        >
          A Python-automated penetration testing pipeline — Nmap, Nikto, SQLMap, Burp Suite,
          Metasploit, Wireshark — that generates a structured PDF vulnerability report. One
          command. Zero manual effort.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="#pipeline"
            className="bg-amber text-bg-primary font-mono font-semibold text-sm px-7 py-3 rounded hover:bg-amber-glow hover:-translate-y-0.5 transition-all shadow-[0_0_24px_rgba(232,124,30,0)] hover:shadow-[0_0_24px_rgba(232,124,30,0.3)]"
          >
            Explore Pipeline →
          </Link>
        </motion.div>

        {/* Terminal Demo */}
        <motion.div variants={item} className="max-w-2xl w-full pt-8">
          <TerminalDemo />
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={item}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-2xl pt-8"
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-surface border border-slate-600 rounded px-6 py-5 text-center hover:border-amber-dim hover:shadow-[0_0_24px_rgba(232,124,30,0.15)] transition"
            >
              <div className="font-display text-3xl sm:text-4xl text-amber">{stat.num}</div>
              <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
