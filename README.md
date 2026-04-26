# VulnScope 

> **AI-Enhanced Automated Web Application Penetration Testing & Vulnerability Reporting Framework**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-ready-brightgreen)](https://fastapi.tiangolo.com)

---

## What Is VulnScope?

VulnScope is an open-source, AI-enhanced automated penetration testing framework. Paste any URL — get a professional PDF vulnerability report in minutes.

It chains **Nmap → Nikto → SQLMap → custom Python probes** into a single automated pipeline, then uses an **LLM (via OpenRouter)** to generate plain-English explanations and developer-ready fix code for every vulnerability found.

**The gap it fills:** Existing tools like Nessus and OpenVAS list vulnerabilities. VulnScope tells developers exactly how to fix them — with actual working code.

---

## Features

- 🔗 **One URL → Full Report** — paste a link, get a PDF automatically
- 🤖 **AI-Generated Fixes** — LLM writes real PHP/Apache/Nginx fix code per finding
- 🧪 **10 OWASP Top 10 Vulnerabilities** tested automatically
- 🌐 **Two Scan Modes** — Aggressive (local/lab) and Passive (any public website)
- 📄 **Professional PDF Report** — cover page, findings table, AI analysis, evidence appendix
- 🖥️ **Web Interface** — paste URL in browser, watch progress bar, download report
- 🔌 **Chrome Extension** — scan any site with one click from your browser
- 📊 **Analytics Dashboard** — vulnerability trends, severity breakdown, scan history
- 🔐 **User Auth** — register, login, manage your scan history

---

## Vulnerabilities Detected

| ID   | Vulnerability               | CVSS  | Severity |
|------|-----------------------------|-------|----------|
| V-01 | SQL Injection               | 9.8   | Critical |
| V-02 | Reflected XSS               | 6.1   | Medium   |
| V-03 | Stored XSS                  | 8.0   | High     |
| V-04 | Command Injection            | 9.0   | Critical |
| V-05 | Insecure File Upload         | 8.8   | High     |
| V-06 | Directory / Path Traversal   | 7.5   | High     |
| V-07 | Broken Authentication        | 7.3   | High     |
| V-08 | Missing HTTP Security Headers| 5.3   | Medium   |
| V-09 | Open Ports / Outdated Services| 10.0 | Critical |
| V-10 | Cross-Site Request Forgery   | 6.5   | Medium   |

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Backend      | Python 3.10+, Flask, SQLite         |
| Scanning     | Nmap, Nikto, SQLMap                 |
| Custom Tests | Python `requests` library           |
| AI Layer     | OpenRouter API (Mistral 7B free)    |
| PDF Reports  | fpdf2                               |
| Frontend     | React / Next.js + TypeScript        |
| Extension    | Chrome Manifest V3                  |
| Deployment   | ngrok (demo) / Linux VPS (prod)     |

---

## Project Structure

```
vulnscope/
├── app.py                  ← Flask backend (all API routes)
├── vulnscope.db            ← SQLite database (auto-created)
├── scan_outputs/           ← Scan results and PDFs (auto-created)
│   ├── {scan_id}/
│   │   ├── nmap.xml
│   │   ├── nikto.txt
│   │   └── sqlmap/
│   └── report_{scan_id}.pdf
├── requirements.txt        ← Python dependencies
├── .gitignore
├── README.md
└── chrome_extension/       ← Browser extension
    ├── manifest.json
    └── popup.html
```

---

## Quick Start

### Prerequisites

- Kali Linux (recommended) or any Debian-based Linux
- Python 3.10+
- Nmap, Nikto, SQLMap installed
- OpenRouter API key (free at [openrouter.ai](https://openrouter.ai))

### 1 — Clone the repo

```bash
git clone https://github.com/yourusername/vulnscope.git
cd vulnscope
```

### 2 — Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3 — Add your OpenRouter API key

Open `app.py` and replace line 18:
```python
OPENROUTER_KEY = "sk-or-v1-your-key-here"
```

### 4 — Start the backend

```bash
python3 app.py
```

Backend runs at `http://localhost:5000`

### 5 — Connect the frontend

In your React/Next.js frontend set:
```typescript
const API_BASE = "http://localhost:5000"
```

### 6 — (Optional) Expose publicly with ngrok

```bash
ngrok http 5000
# Use the generated URL in your frontend instead of localhost
```

---

## API Reference

All endpoints require `Authorization: Bearer <token>` header (except `/auth/login` and `/auth/register`).

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| POST   | `/auth/register`                | Create account                 |
| POST   | `/auth/login`                   | Login → returns token          |
| GET    | `/auth/me`                      | Get current user               |
| POST   | `/auth/logout`                  | Logout                         |
| GET    | `/dashboard/bootstrap`          | Get all data for dashboard     |
| POST   | `/targets`                      | Add a scan target              |
| PUT    | `/targets/:id`                  | Update target                  |
| DELETE | `/targets/:id`                  | Delete target                  |
| POST   | `/scans`                        | Start a new scan               |
| GET    | `/scans/:id/pipeline`           | Poll scan progress             |
| GET    | `/reports`                      | List all completed reports     |
| GET    | `/reports/:scanId`              | Download PDF report            |
| POST   | `/findings/:id/accept-fix`      | Mark fix as accepted           |
| POST   | `/findings/:id/reject-fix`      | Mark fix as rejected           |
| POST   | `/settings`                     | Save user settings             |

### Start a Scan — Example

```bash
curl -X POST http://localhost:5000/scans \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "http://localhost/dvwa"}'
```

Response:
```json
{
  "id": "abc12345",
  "targetUrl": "http://localhost/dvwa",
  "status": "running",
  "progress": 0,
  "message": "Scan started",
  "createdAt": "2025-04-21T10:30:00"
}
```

### Poll Progress

```bash
curl http://localhost:5000/scans/abc12345/pipeline \
  -H "Authorization: Bearer your-token"
```

Response:
```json
{
  "status": "running",
  "progress": 65,
  "message": "Running SQLMap...",
  "stages": [
    {"name": "Nmap Port Scan",   "status": "done"},
    {"name": "Nikto Web Scan",   "status": "done"},
    {"name": "Header Analysis",  "status": "done"},
    {"name": "SQLMap Injection", "status": "running"},
    {"name": "Custom Tests",     "status": "pending"},
    {"name": "AI Analysis",      "status": "pending"},
    {"name": "PDF Generation",   "status": "pending"}
  ]
}
```

---

## Scan Modes

### Aggressive Mode (local/authorised targets only)
Triggers automatically when URL contains `localhost`, `127.0.0.1`, or `192.168.x.x`.

Tests: SQL injection, XSS (reflected + stored), command injection, directory traversal, brute force, CSRF, missing headers, open ports.

### Passive Mode (any public website — fully legal)
Triggers for all external URLs.

Tests: HTTP security headers, server version disclosure, open ports, exposed sensitive files (`.env`, `.git`, `phpinfo.php`), robots.txt analysis, HTTPS enforcement.

> ⚠️ **Legal Notice:** Only use Aggressive Mode on systems you own or have written permission to test. Passive Mode only performs read-only reconnaissance. Unauthorised penetration testing is illegal.

---

## Chrome Extension

### Install for Demo (no Web Store needed)

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `chrome_extension/` folder
5. Click the VulnScope icon in your toolbar

The extension auto-fills the current tab's URL and connects to your local Flask backend.

---

## Setting Up the Lab (DVWA)

For testing with a safe vulnerable target:

```bash
# Install DVWA on Kali Linux
sudo apt update
sudo apt install dvwa -y
sudo systemctl start mysql
sudo systemctl start apache2
sudo dvwa-start

# Visit in browser
http://localhost/dvwa
# Login: admin / password
# Set security to: Low
```

---

## Research Backing

VulnScope is research-informed. Key papers:

| Paper | Relevance |
|-------|-----------|
| Alghawazi et al., MDPI 2022 | SQLi systematic review → SQLMap integration |
| Hosam et al., IEEE ISCMI 2021 | ML-based SQLi detection → payload coverage |
| Kissoon & Bekaroo, Springer 2024 | XSS hybrid detection → Nikto + custom probes |
| Happe & Cito, ACM ESEC/FSE 2023 | LLMs for pentesting → AI fix generation |
| Ferrag et al., IEEE Access 2024 | LLMs for threat detection → AI layer design |
| IEEE ICITISEE 2023 Review | Reporting gap → Python report generator |

Full bibliography in the IEEE paper (`vulnscope_ieee_paper.tex`).

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Authors

Built as a Final Year Engineering Project — Cybersecurity Stream, 2024–25.

---

*VulnScope: Because finding vulnerabilities is only half the job. Fixing them is the other half.*
