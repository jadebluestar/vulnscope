// lib/research-data.ts
export interface ResearchDomain {
  num: string;
  title: string;
  summary: string;
  designImpact: string;
  refs: { tag: string; label: string }[];
}

export const RESEARCH_DOMAINS: ResearchDomain[] = [
  {
    num: "3.1",
    title: "SQL Injection Detection",
    summary: "Comprehensive parameter coverage (all input vectors) is the key to detection completeness, not just visible form fields.",
    designImpact: "SQLMap runs multi-payload tests (error‑based, blind, union) across every parameter.",
    refs: [{ tag: "[2]", label: "MIGUELTIZA 2022" }, { tag: "[4]", label: "HOUAN 2021" }],
  },
  {
    num: "3.2",
    title: "Cross‑Site Scripting (XSS)",
    summary: "AI tools work well for reflected XSS, but stored XSS remains hard. Hybrid URL+DOM analysis reduces false positives.",
    designImpact: "Nikto automates header checks; Burp Suite handles manual payload injection.",
    refs: [{ tag: "[4]", label: "ZHANG 2023" }, { tag: "[7]", label: "BILLSON 2023" }],
  },
  {
    num: "3.3",
    title: "Automated Pentest Frameworks",
    summary: "Automated reporting is the weakest link in student implementations. Few pipelines connect recon → exploit → report.",
    designImpact: "Python PDF generator solves this gap – one command, one structured report.",
    refs: [{ tag: "[8]", label: "KESSLERCHATE 2022" }, { tag: "[9]", label: "RESEARCHGATE 2022" }],
  },
  {
    num: "3.4",
    title: "API & Modern Web Security",
    summary: "OWASP API Top 10 shows injection vulnerabilities are as common in APIs as in traditional forms.",
    designImpact: "Burp Intruder fuzzes headers, query strings, and cookies – not just HTML form fields.",
    refs: [{ tag: "[11]", label: "OWASP API 2023" }, { tag: "[12]", label: "GRAPHIC CHART SHEET" }],
  },
];