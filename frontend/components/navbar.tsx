"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Menu, Shield, X } from "lucide-react";

const sectionLinks = [
  { label: "About", href: "#about", id: "about" },
  { label: "Pipeline", href: "#pipeline", id: "pipeline" },
  { label: "Research", href: "#research", id: "research" },
];

function renderNavItems(activeSection: string, onNavigate: () => void): React.ReactNode {
  return (
    <>
      {sectionLinks.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          onClick={onNavigate}
          className={`text-sm transition-colors ${
            activeSection === link.id ? "text-amber" : "text-muted hover:text-primary"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/auth/login"
        onClick={onNavigate}
        className="text-sm text-muted transition-colors hover:text-primary"
      >
        Login
      </Link>
    </>
  );
}

export default function Navbar(): React.ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const sections = useMemo(() => ["hero", ...sectionLinks.map((item) => item.id), "owasp"], []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        threshold: [0.15, 0.45, 0.7],
        rootMargin: "-20% 0px -55% 0px",
      }
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-amber-dim/60 bg-bg-primary/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
      aria-label="Landing navigation"
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-dim bg-amber/10 text-amber">
            <Shield size={18} />
          </div>
          <div>
            <p className="font-display text-2xl tracking-widest text-primary">VulnScope</p>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.35em] text-muted">
              Lab Isolated . Testing Active
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {renderNavItems(activeSection, () => setMobileOpen(false))}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/auth/register"
            className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-bg-primary transition hover:bg-amber-glow"
          >
            Launch Console
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="rounded-lg border border-amber-dim/70 p-2 text-amber md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-amber-dim/50 bg-bg-secondary px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {renderNavItems(activeSection, () => setMobileOpen(false))}
            <Link
              href="/auth/register"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl bg-amber px-4 py-3 text-center text-sm font-semibold text-bg-primary"
            >
              Launch Console
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}