export interface PipelineStep {
  id:          string;
  num:         string;
  icon:        string;
  title:       string;
  description: string;
  output:      string;
  isFinal:     boolean;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "lab",
    num: "01",
    icon: "🖥",
    title: "VirtualBox Lab",
    description: "Internal Network mode isolates the lab completely. Kali Linux attacks DVWA and Metasploitable 2. All testing is safe and legal.",
    output: "→ Isolated environment",
    isFinal: false,
  },
  {
    id: "nmap",
    num: "02",
    icon: "🔍",
    title: "Nmap Recon",
    description: "Port scanning, service version detection, and OS fingerprinting. The -oX flag saves structured XML output for the Python parser.",
    output: "→ nmap_output.xml",
    isFinal: false,
  },
  {
    id: "nikto",
    num: "03",
    icon: "🌐",
    title: "Nikto Web Scan",
    description: "Checks 6,700+ known configurations, missing security headers (CSP, HSTS), and outdated software versions.",
    output: "→ nikto_log.txt",
    isFinal: false,
  },
  {
    id: "sqli",
    num: "04",
    icon: "💉",
    title: "SQLMap + Burp Suite",
    description: "Automated multi-payload SQLi across all parameters. Burp intercepts HTTP for manual XSS testing and Intruder parameter fuzzing.",
    output: "→ sqlmap_log.txt",
    isFinal: false,
  },
  {
    id: "metasploit",
    num: "05",
    icon: "💥",
    title: "Metasploit Exploit",
    description: "Pre-built exploit modules for known CVEs against Metasploitable 2. Documents the full attack kill chain.",
    output: "→ session + screenshots",
    isFinal: false,
  },
  {
    id: "wireshark",
    num: "06",
    icon: "📡",
    title: "Wireshark Capture",
    description: "Full packet capture during exploitation. Shows the attack at the network layer — TCP handshakes, payload delivery, shell responses.",
    output: "→ capture.pcap",
    isFinal: false,
  },
  {
    id: "report",
    num: "07",
    icon: "📄",
    title: "Python → PDF Report",
    description: "Parses all outputs. Regex classifier assigns HIGH/MEDIUM/LOW severity. Builds a PDF with CVSS scores and remediation steps via fpdf2.",
    output: "→ vulnscope_report.pdf",
    isFinal: true,
  },
];
