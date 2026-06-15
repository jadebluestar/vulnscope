# VulnScope: AI-Enhanced Automated Web Application Penetration Testing & Vulnerability Reporting Framework

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)

---

## 🚀 What Is VulnScope?

**VulnScope** is an open-source, AI-enhanced automated penetration testing framework that transforms web application security testing into a streamlined, developer-friendly experience.

Simply provide a target URL and VulnScope automatically performs reconnaissance, vulnerability assessment, AI-powered analysis, and generates a professional PDF security report within minutes.

### Why VulnScope?

Traditional scanners such as Nessus and OpenVAS identify vulnerabilities but often leave developers searching for remediation guidance.

**VulnScope goes one step further** by:

* Detecting vulnerabilities automatically
* Explaining findings in plain English
* Generating developer-ready remediation code
* Producing professional security reports

---

## ✨ Features

* 🔗 **One URL → Full Report**

  * Paste a URL and receive a complete vulnerability assessment report.

* 🤖 **AI-Generated Fixes**

  * Uses OpenRouter-hosted LLMs to generate remediation code and security recommendations.

* 🧪 **OWASP Top 10 Coverage**

  * Automatically tests multiple common vulnerability categories.

* 🌐 **Dual Scan Modes**

  * Aggressive Mode (authorized internal targets)
  * Passive Mode (public websites)

* 📄 **Professional PDF Reports**

  * Cover page
  * Executive summary
  * Findings table
  * AI-generated analysis
  * Evidence appendix

* 🖥️ **Web Dashboard**

  * Real-time scan progress
  * Report downloads
  * Scan management

* 🔌 **Chrome Extension**

  * Scan websites directly from your browser.

* 📊 **Analytics Dashboard**

  * Severity breakdowns
  * Scan history
  * Vulnerability trends

* 🔐 **Authentication System**

  * Registration
  * Login
  * Scan history management

---

# 🛡️ Vulnerabilities Detected

| ID   | Vulnerability                     | CVSS | Severity |
| ---- | --------------------------------- | ---- | -------- |
| V-01 | SQL Injection                     | 9.8  | Critical |
| V-02 | Reflected XSS                     | 6.1  | Medium   |
| V-03 | Stored XSS                        | 8.0  | High     |
| V-04 | Command Injection                 | 9.0  | Critical |
| V-05 | Insecure File Upload              | 8.8  | High     |
| V-06 | Directory / Path Traversal        | 7.5  | High     |
| V-07 | Broken Authentication             | 7.3  | High     |
| V-08 | Missing HTTP Security Headers     | 5.3  | Medium   |
| V-09 | Open Ports / Outdated Services    | 7.5  | High     |
| V-10 | Cross-Site Request Forgery (CSRF) | 6.5  | Medium   |

> **Note:** CVSS scores are based on commonly accepted industry practices and may vary depending on deployment context.

---

# 🏗️ Tech Stack

| Layer                 | Technology                   |
| --------------------- | ---------------------------- |
| Backend               | Python 3.10+, Flask, SQLite  |
| Scanning Engine       | Nmap, Nikto, SQLMap          |
| Custom Security Tests | Python Requests Library      |
| AI Layer              | OpenRouter API (Mistral 7B)  |
| PDF Generation        | fpdf2                        |
| Frontend              | React / Next.js + TypeScript |
| Browser Extension     | Chrome Manifest V3           |
| Deployment            | Linux VPS / ngrok            |

---

# 📂 Project Structure

```text
vulnscope/
│
├── app.py                      # Flask backend
├── vulnscope.db                # SQLite database (auto-created)
├── requirements.txt
├── README.md
├── .gitignore
│
├── scan_outputs/
│   ├── {scan_id}/
│   │   ├── nmap.xml
│   │   ├── nikto.txt
│   │   └── sqlmap/
│   │
│   └── report_{scan_id}.pdf
│
└── chrome_extension/
    ├── manifest.json
    └── popup.html
```

---

# ⚡ Quick Start (Kali Linux Recommended)

## Prerequisites

* Kali Linux (or Debian-based distribution)
* Python 3.10+
* Nmap installed
* Nikto installed
* SQLMap installed
* OpenRouter API Key

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/jadebluestar/vulnscope.git

cd vulnscope
```

---

## 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 3️⃣ Configure OpenRouter API Key

Open `app.py` and update:

```python
OPENROUTER_KEY = "sk-or-v1-your-key-here"
```

---

## 4️⃣ Start the Backend

```bash
python3 app.py
```

Backend:

```text
http://localhost:5000
```

---

## 5️⃣ Start the Frontend

Open a second terminal:

```bash
cd frontend

npm install

echo "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000" > .env.local

npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## 6️⃣ Optional: Public Access via ngrok

```bash
ngrok http 5000
```

Use the generated URL inside the frontend configuration.

---

# 🔍 Scan Modes

## Aggressive Mode

**For local and authorized targets only**

Automatically enabled when the target contains:

```text
localhost
127.0.0.1
192.168.x.x
```

### Tests Performed

* SQL Injection
* Reflected XSS
* Stored XSS
* Command Injection
* Directory Traversal
* Brute Force Checks
* CSRF
* Missing Security Headers
* Open Port Discovery

---

## Passive Mode

**For public websites**

### Tests Performed

* HTTP Security Header Analysis
* HTTPS Enforcement
* Server Version Disclosure
* Open Ports
* robots.txt Analysis
* Sensitive File Discovery

  * `.env`
  * `.git`
  * `phpinfo.php`

---

## ⚠️ Legal Notice

Aggressive Mode must only be used on systems you own or have explicit written permission to test.

Unauthorized penetration testing may violate local laws and regulations.

Passive Mode performs read-only reconnaissance activities.

---

# 🔌 Chrome Extension

### Installation

1. Open Chrome
2. Navigate to:

```text
chrome://extensions
```

3. Enable **Developer Mode**
4. Click **Load Unpacked**
5. Select:

```text
chrome_extension/
```

6. Pin the VulnScope extension
7. Click the extension icon

The extension automatically detects the current tab URL and communicates with the local VulnScope backend.

---

# 🧪 Setting Up the DVWA Testing Lab

For safe vulnerability testing:

```bash
sudo apt update

sudo apt install dvwa -y

sudo systemctl start mysql

sudo systemctl start apache2

sudo dvwa-start
```

Visit:

```text
http://localhost/dvwa
```

### Default Credentials

```text
Username: admin
Password: password
```

Set security level:

```text
Security = Low
```

---

# 🔗 API Reference

All endpoints require:

```http
Authorization: Bearer <token>
```

except:

```text
/auth/login
/auth/register
```

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| POST   | /auth/register           | Create account          |
| POST   | /auth/login              | Login and receive token |
| GET    | /auth/me                 | Current user            |
| POST   | /auth/logout             | Logout                  |
| GET    | /dashboard/bootstrap     | Dashboard data          |
| POST   | /targets                 | Add target              |
| PUT    | /targets/:id             | Update target           |
| DELETE | /targets/:id             | Delete target           |
| POST   | /scans                   | Start scan              |
| GET    | /scans/:id/pipeline      | Scan progress           |
| GET    | /reports                 | List reports            |
| GET    | /reports/:scanId         | Download report         |
| POST   | /findings/:id/accept-fix | Accept fix              |
| POST   | /findings/:id/reject-fix | Reject fix              |
| POST   | /settings                | Save settings           |

---

# 🚀 Start a Scan

### Request

```bash
curl -X POST http://localhost:5000/scans \
-H "Authorization: Bearer your-token" \
-H "Content-Type: application/json" \
-d '{
      "targetUrl":"http://localhost/dvwa"
    }'
```

### Response

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

---

# 📈 Poll Scan Progress

### Request

```bash
curl http://localhost:5000/scans/abc12345/pipeline \
-H "Authorization: Bearer your-token"
```

### Response

```json
{
  "status": "running",
  "progress": 65,
  "message": "Running SQLMap...",
  "stages": [
    {"name":"Nmap Port Scan","status":"done"},
    {"name":"Nikto Web Scan","status":"done"},
    {"name":"Header Analysis","status":"done"},
    {"name":"SQLMap Injection","status":"running"},
    {"name":"Custom Tests","status":"pending"},
    {"name":"AI Analysis","status":"pending"},
    {"name":"PDF Generation","status":"pending"}
  ]
}
```

---

# 📚 Research Foundation

VulnScope is informed by contemporary cybersecurity and AI-assisted security research.

| Research Work                      | Relevance               |
| ---------------------------------- | ----------------------- |
| Alghawazi et al. (MDPI, 2022)      | SQL Injection review    |
| Hosam et al. (IEEE ISCMI, 2021)    | ML-based SQLi detection |
| Kissoon & Bekaroo (Springer, 2024) | Hybrid XSS detection    |
| Happe & Cito (ACM ESEC/FSE, 2023)  | LLM-assisted pentesting |
| Ferrag et al. (IEEE Access, 2024)  | AI threat detection     |
| IEEE ICITISEE Review (2023)        | Security reporting gap  |

---

# 🤝 Contributing

```bash
# Fork the repository

git checkout -b feature/your-feature

git commit -m "Add your feature"

git push origin feature/your-feature
```

Then open a Pull Request.

---

# 📄 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for details.

---

# 👨‍💻 Authors

Developed as a Final Year Engineering Project in Cybersecurity (2024–2025).

---

# ⭐ Motto

> **"Finding vulnerabilities is only half the job. Fixing them is the other half."**
>
> — VulnScope
