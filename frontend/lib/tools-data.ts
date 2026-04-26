export interface ToolItem {
  id:          string;
  name:        string;
  category:    "INFRA" | "OS" | "TARGET" | "RECON" | "SCAN" | "EXPLOIT" | "ANALYSIS" | "REPORT" | "DEVOPS";
  version:     string;
  description: string;
  highlight:   boolean;
}

export const TOOLS: ToolItem[] = [
  {
    id: "virtualbox",
    name: "VirtualBox",
    category: "INFRA",
    version: "7.x",
    description: "Hosts all VMs in Internal Network mode — complete isolation from the real network. Essential for safe, legal testing on one laptop.",
    highlight: false,
  },
  {
    id: "kali",
    name: "Kali Linux",
    category: "OS",
    version: "2024.x",
    description: "Debian-based attacker OS pre-loaded with Nmap, Nikto, Burp Suite, Metasploit, Wireshark, and SQLMap. Eliminates individual setup time.",
    highlight: false,
  },
  {
    id: "dvwa",
    name: "DVWA",
    category: "TARGET",
    version: "v2.3+",
    description: "Damn Vulnerable Web Application. Configurable vulnerabilities at Low/Medium/High — SQLi, XSS, CSRF, file upload, command injection.",
    highlight: false,
  },
  {
    id: "metasploitable",
    name: "Metasploitable 2",
    category: "TARGET",
    version: "v2",
    description: "Intentionally vulnerable Linux VM with known CVEs across FTP, SSH, HTTP, and Samba services. Realistic exploitation target.",
    highlight: false,
  },
  {
    id: "nmap",
    name: "Nmap",
    category: "RECON",
    version: "v7.94+",
    description: "Port scanning, service version detection (-sV), OS fingerprinting (-O). The -oX flag saves structured XML that feeds the Python parser directly.",
    highlight: true,
  },
  {
    id: "nikto",
    name: "Nikto",
    category: "SCAN",
    version: "v2.x",
    description: "Checks 6,700+ known vulnerable configurations, missing security headers (CSP, HSTS, X-Frame-Options), and outdated software versions.",
    highlight: false,
  },
  {
    id: "burpsuite",
    name: "Burp Suite CE",
    category: "EXPLOIT",
    version: "Community Ed.",
    description: "Intercepts HTTP/HTTPS traffic. Intruder module fuzzes URL params, POST body, and HTTP headers — not just visible form fields.",
    highlight: true,
  },
  {
    id: "sqlmap",
    name: "SQLMap",
    category: "EXPLOIT",
    version: "v1.8+",
    description: "Systematically tests all input parameters for error-based, time-based blind, union-based, and boolean-based SQL injection.",
    highlight: true,
  },
  {
    id: "metasploit",
    name: "Metasploit",
    category: "EXPLOIT",
    version: "msf6",
    description: "Pre-built exploit modules for known CVEs. Runs against Metasploitable 2 to document the full recon → scan → exploit → access kill chain.",
    highlight: false,
  },
  {
    id: "wireshark",
    name: "Wireshark",
    category: "ANALYSIS",
    version: "v4.x",
    description: "Full packet capture during exploitation. Produces .pcap evidence showing TCP handshakes, payload delivery, and shell responses.",
    highlight: false,
  },
  {
    id: "python",
    name: "Python 3 + fpdf2",
    category: "REPORT",
    version: "Python 3.10+",
    description: "Core of VulnScope. Parses all outputs, assigns severity via regex classifier (HIGH/MEDIUM/LOW), builds a PDF with CVSS scores and remediation. ~150–180 lines.",
    highlight: true,
  },
  {
    id: "github",
    name: "GitHub",
    category: "DEVOPS",
    version: "—",
    description: "All scripts, scan outputs, screenshots, and the final report committed here. Clear development history and a shareable deliverable.",
    highlight: false,
  },
];

export const TOOL_CATEGORIES = ["ALL", "INFRA", "OS", "TARGET", "RECON", "SCAN", "EXPLOIT", "ANALYSIS", "REPORT", "DEVOPS"] as const;
export type ToolCategory = typeof TOOL_CATEGORIES[number];
