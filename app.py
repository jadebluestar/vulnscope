from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from openai import OpenAI
from fpdf import FPDF
import subprocess, requests as req
import os, json, threading, uuid, sqlite3
import hashlib, secrets, ssl, socket
from urllib.parse import urlparse
from datetime import datetime
import urllib3
urllib3.disable_warnings()

app = Flask(__name__)
CORS(app, supports_credentials=True,
     resources={r"/*": {"origins": "*"}},
     expose_headers=["Content-Disposition", "Content-Type"])

OPENROUTER_KEY = "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"
OUTPUT_DIR = "scan_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ════════════════════════════════════════════════════
# DATABASE
# ════════════════════════════════════════════════════
def init_db():
    conn = sqlite3.connect("vulnscope.db")
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        token TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        target_url TEXT,
        status TEXT,
        progress INTEGER DEFAULT 0,
        message TEXT DEFAULT '',
        findings TEXT DEFAULT '[]',
        ai_analysis TEXT DEFAULT '',
        findings_count INTEGER DEFAULT 0,
        critical INTEGER DEFAULT 0,
        high INTEGER DEFAULT 0,
        medium INTEGER DEFAULT 0,
        low INTEGER DEFAULT 0,
        scan_mode TEXT DEFAULT 'passive',
        created_at TEXT
    )""")
    # Add scan_mode column if upgrading existing DB
    try:
        c.execute("ALTER TABLE scans ADD COLUMN scan_mode TEXT DEFAULT 'passive'")
    except Exception:
        pass
    c.execute("""CREATE TABLE IF NOT EXISTS targets (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        url TEXT,
        name TEXT,
        created_at TEXT
    )""")
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect("vulnscope.db")
    conn.row_factory = sqlite3.Row
    return conn

def new_id():
    return str(uuid.uuid4())[:8]

def get_user(r):
    token = r.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not token:
        return None
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE token=?", (token,)).fetchone()
    conn.close()
    return user

def detect_mode(url):
    """Auto-detect aggressive vs passive mode based on URL"""
    host = (urlparse(url).hostname or "").lower()
    aggressive_hosts = [
        "localhost", "127.0.0.1", "dvwa", "metasploitable",
        "testphp.vulnweb.com", "demo.testfire.net",
        "zero.webappsecurity.com", "vulnweb"
    ]
    private_ranges = [
        "192.168.", "10.0.", "10.1.", "10.2.", "10.3.",
        "172.16.", "172.17.", "172.18.", "172.19.", "172.20."
    ]
    if any(m in host for m in aggressive_hosts):
        return "aggressive"
    if any(host.startswith(p) for p in private_ranges):
        return "aggressive"
    return "passive"

# ════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════
@app.route("/auth/register", methods=["POST"])
def register():
    d = request.get_json()
    if not d or not d.get("email") or not d.get("password"):
        return jsonify({"error": "Email and password required"}), 400
    uid = new_id()
    pw  = hashlib.sha256(d["password"].encode()).hexdigest()
    tok = secrets.token_hex(32)
    try:
        conn = get_db()
        conn.execute("INSERT INTO users VALUES (?,?,?,?,?)",
            (uid, d["email"], pw, d.get("name", "User"), tok))
        conn.commit()
        conn.close()
        return jsonify({
            "user": {"id": uid, "email": d["email"], "name": d.get("name", "User")},
            "token": tok
        })
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 409

@app.route("/auth/login", methods=["POST"])
def login():
    d  = request.get_json()
    pw = hashlib.sha256(d["password"].encode()).hexdigest()
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email=? AND password=?",
        (d["email"], pw)
    ).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Wrong email or password"}), 401
    tok = secrets.token_hex(32)
    conn.execute("UPDATE users SET token=? WHERE id=?", (tok, user["id"]))
    conn.commit()
    conn.close()
    return jsonify({
        "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
        "token": tok
    })

@app.route("/auth/me", methods=["GET"])
def me():
    user = get_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"id": user["id"], "email": user["email"], "name": user["name"]})

@app.route("/auth/logout", methods=["POST"])
def logout():
    user = get_user(request)
    if user:
        conn = get_db()
        conn.execute("UPDATE users SET token='' WHERE id=?", (user["id"],))
        conn.commit()
        conn.close()
    return jsonify({"message": "Logged out"})

# ════════════════════════════════════════════════════
# DASHBOARD
# ════════════════════════════════════════════════════
@app.route("/dashboard/bootstrap", methods=["GET"])
def bootstrap():
    user = get_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    uid = user["id"]
    conn = get_db()
    targets = [dict(r) for r in conn.execute(
        "SELECT * FROM targets WHERE user_id=?", (uid,)).fetchall()]
    scans_raw = conn.execute(
        "SELECT * FROM scans WHERE user_id=? ORDER BY created_at DESC",
        (uid,)).fetchall()
    conn.close()

    scans, vulns, reports = [], [], []
    for s in scans_raw:
        sd = dict(s)
        findings = json.loads(sd["findings"] or "[]")
        scans.append({
            "id":           sd["id"],
            "targetUrl":    sd["target_url"],
            "status":       sd["status"],
            "progress":     sd["progress"],
            "message":      sd["message"],
            "createdAt":    sd["created_at"],
            "scanMode":     sd.get("scan_mode", "passive"),
            "findingsCount":sd["findings_count"],
            "critical":     sd["critical"],
            "high":         sd["high"],
            "medium":       sd["medium"],
            "low":          sd["low"],
        })
        for f in findings:
            vulns.append({**f, "scanId": sd["id"]})
        if sd["status"] == "done":
            reports.append({
                "id":           sd["id"],
                "scanId":       sd["id"],
                "targetUrl":    sd["target_url"],
                "createdAt":    sd["created_at"],
                "scanMode":     sd.get("scan_mode", "passive"),
                "findingsCount":sd["findings_count"],
                "critical":     sd["critical"],
                "high":         sd["high"],
                "medium":       sd["medium"],
                "low":          sd["low"],
            })

    crits = sum(1 for v in vulns if v.get("severity") == "CRITICAL")
    return jsonify({
        "targets":         targets,
        "scans":           scans,
        "vulnerabilities": vulns,
        "reports":         reports,
        "settings":        {"notifications": True, "autoScan": False},
        "stats": {
            "totalScans":    len(scans),
            "totalVulns":    len(vulns),
            "criticalVulns": crits,
            "fixedVulns":    0,
            "targetsScanned":len(targets)
        }
    })

# ════════════════════════════════════════════════════
# TARGETS
# ════════════════════════════════════════════════════
@app.route("/targets", methods=["POST"])
def create_target():
    user = get_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    d   = request.get_json()
    tid = new_id()
    now = datetime.now().isoformat()
    conn = get_db()
    conn.execute("INSERT INTO targets VALUES (?,?,?,?,?)",
        (tid, user["id"], d.get("url", ""), d.get("name", "Target"), now))
    conn.commit()
    conn.close()
    return jsonify({"id": tid, "url": d.get("url"), "name": d.get("name", "Target"), "createdAt": now})

@app.route("/targets/<tid>", methods=["PUT"])
def update_target(tid):
    user = get_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    d = request.get_json()
    conn = get_db()
    conn.execute("UPDATE targets SET url=?,name=? WHERE id=? AND user_id=?",
        (d.get("url"), d.get("name"), tid, user["id"]))
    conn.commit()
    conn.close()
    return jsonify({"id": tid, **d})

@app.route("/targets/<tid>", methods=["DELETE"])
def delete_target(tid):
    user = get_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    conn = get_db()
    conn.execute("DELETE FROM targets WHERE id=? AND user_id=?", (tid, user["id"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted"})

# ════════════════════════════════════════════════════
# SCANS
# ════════════════════════════════════════════════════
@app.route("/scans", methods=["POST"])
def create_scan():
    user = get_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    d    = request.get_json()
    url  = d.get("targetUrl") or d.get("url", "")
    sid  = new_id()
    now  = datetime.now().isoformat()
    mode = detect_mode(url)
    conn = get_db()
    conn.execute(
        "INSERT INTO scans VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (sid, user["id"], url, "running", 0,
         "Starting...", "[]", "", 0, 0, 0, 0, 0, mode, now)
    )
    conn.commit()
    conn.close()
    t = threading.Thread(target=run_scan, args=(sid, url, mode))
    t.daemon = True
    t.start()
    return jsonify({
        "id": sid, "targetUrl": url,
        "status": "running", "progress": 0,
        "message": "Scan started",
        "scanMode": mode, "createdAt": now
    })

@app.route("/scans/<sid>/pipeline", methods=["GET"])
def pipeline(sid):
    conn = get_db()
    scan = conn.execute("SELECT * FROM scans WHERE id=?", (sid,)).fetchone()
    conn.close()
    if not scan:
        return jsonify({"error": "Not found"}), 404
    p = scan["progress"]
    stages = [
        {"name": "Nmap Port Scan",     "status": "done" if p > 15 else ("running" if p > 0  else "pending")},
        {"name": "Nikto Web Scan",     "status": "done" if p > 30 else ("running" if p > 15 else "pending")},
        {"name": "Header Analysis",    "status": "done" if p > 45 else ("running" if p > 30 else "pending")},
        {"name": "Vulnerability Tests","status": "done" if p > 75 else ("running" if p > 45 else "pending")},
        {"name": "AI Analysis",        "status": "done" if p > 90 else ("running" if p > 75 else "pending")},
        {"name": "PDF Generation",     "status": "done" if p >= 100 else ("running" if p > 90 else "pending")},
    ]
    return jsonify({
        "scanId":        sid,
        "status":        scan["status"],
        "progress":      scan["progress"],
        "message":       scan["message"],
        "scanMode": scan["scan_mode"] if "scan_mode" in scan.keys() and scan["scan_mode"] not in ["passive", "aggressive"] else (scan["scan_mode"] if "scan_mode" in scan.keys() else "passive"),
        "stages":        stages,
        "findingsCount": scan["findings_count"],
        "critical":      scan["critical"],
        "high":          scan["high"],
        "medium":        scan["medium"],
        "low":           scan["low"],
    })

# ════════════════════════════════════════════════════
# REPORTS
# ════════════════════════════════════════════════════
@app.route("/reports", methods=["GET"])
def get_reports():
    user = get_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    conn = get_db()
    scans = conn.execute(
        "SELECT * FROM scans WHERE user_id=? AND status='done' ORDER BY created_at DESC",
        (user["id"],)
    ).fetchall()
    conn.close()
    return jsonify([{
        "id":           s["id"],
        "scanId":       s["id"],
        "targetUrl":    s["target_url"],
        "createdAt":    s["created_at"],
        "findingsCount":s["findings_count"],
        "scanMode":     s["scan_mode"] if "scan_mode" in s.keys() else "passive",
        "critical":     s["critical"],
        "high":         s["high"],
        "medium":       s["medium"],
        "low":          s["low"],
    } for s in scans])

@app.route("/reports/<sid>", methods=["GET"])
def download_report(sid):
    paths = [
        os.path.abspath(f"{OUTPUT_DIR}/report_{sid}.pdf"),
        os.path.abspath(f"report_{sid}.pdf"),
        os.path.abspath(f"{OUTPUT_DIR}/{sid}/report.pdf"),
    ]
    pdf_path = next((p for p in paths if os.path.exists(p)), None)
    if not pdf_path:
        files = os.listdir(OUTPUT_DIR) if os.path.exists(OUTPUT_DIR) else []
        return jsonify({"error": "PDF not found", "scan_id": sid, "files": files}), 404
    response = send_file(
        pdf_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"vulnscope_report_{sid}.pdf"
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition, Content-Type"
    return response

# ════════════════════════════════════════════════════
# FINDINGS
# ════════════════════════════════════════════════════
@app.route("/findings/<fid>/accept-fix", methods=["POST"])
def accept_fix(fid):
    return jsonify({"id": fid, "fixStatus": "accepted"})

@app.route("/findings/<fid>/reject-fix", methods=["POST"])
def reject_fix(fid):
    return jsonify({"id": fid, "fixStatus": "rejected"})

@app.route("/settings", methods=["POST"])
def save_settings():
    return jsonify({"message": "Saved"})

# ════════════════════════════════════════════════════
# DEBUG
# ════════════════════════════════════════════════════
@app.route("/debug", methods=["GET"])
def debug():
    conn = get_db()
    scans = [dict(s) for s in conn.execute(
        "SELECT id, status, progress, target_url, scan_mode FROM scans ORDER BY created_at DESC LIMIT 5"
    ).fetchall()]
    users = [dict(u) for u in conn.execute("SELECT id, email FROM users").fetchall()]
    conn.close()
    files = os.listdir(OUTPUT_DIR) if os.path.exists(OUTPUT_DIR) else []
    return jsonify({
        "recent_scans": scans,
        "users": users,
        "output_files": files,
        "cwd": os.getcwd()
    })

# ════════════════════════════════════════════════════
# SCAN ENGINE
# ════════════════════════════════════════════════════
def set_status(sid, progress, message):
    conn = get_db()
    conn.execute("UPDATE scans SET progress=?,message=? WHERE id=?",
                 (progress, message, sid))
    conn.commit()
    conn.close()

def run_scan(sid, target_url, mode="passive"):
    findings  = []
    host      = urlparse(target_url).hostname or target_url
    scan_dir  = f"{OUTPUT_DIR}/{sid}"
    is_local  = (mode == "aggressive")
    os.makedirs(scan_dir, exist_ok=True)

    try:
        # ── 1. NMAP ─────────────────────────────────────
        set_status(sid, 8, "Running Nmap port scan...")
        nmap_file = f"{scan_dir}/nmap.xml"
        try:
            subprocess.run(
                ["nmap", "-sV", "-T4", "--top-ports", "20",
                 "--open", "-oX", nmap_file, host],
                capture_output=True, timeout=60
            )
        except Exception:
            pass

        if os.path.exists(nmap_file):
            with open(nmap_file) as f:
                nmap_text = f.read()
            cnt = nmap_text.count('state="open"')
            if cnt > 0:
                findings.append({
                    "id": f"V09-{sid}", "vulnId": "V-09",
                    "name": "Open Ports / Service Exposure",
                    "severity": "HIGH" if cnt > 5 else "MEDIUM",
                    "evidence": f"{cnt} open port(s) found.\n{nmap_text[:400]}",
                    "fixStatus": "pending"
                })

        # ── 2. NIKTO ────────────────────────────────────
        set_status(sid, 22, "Running Nikto web scan...")
        nikto_file = f"{scan_dir}/nikto.txt"
        try:
            subprocess.run(
                ["nikto", "-h", target_url, "-o", nikto_file,
                 "-Format", "txt", "-maxtime", "30"],
                capture_output=True, timeout=90
            )
        except Exception:
            pass

        if os.path.exists(nikto_file):
            with open(nikto_file) as f:
                nikto_text = f.read()
            if len(nikto_text) > 100:
                findings.append({
                    "id": f"V08n-{sid}", "vulnId": "V-08",
                    "name": "Web Server Misconfiguration (Nikto)",
                    "severity": "MEDIUM",
                    "evidence": nikto_text[:500],
                    "fixStatus": "pending"
                })

        # ── 3. HEADER CHECK (all websites) ──────────────
        set_status(sid, 38, "Checking HTTP security headers...")
        try:
            r = req.get(target_url, timeout=10, verify=False,
                        allow_redirects=True,
                        headers={"User-Agent": "Mozilla/5.0 VulnScope/1.0"})
            missing = [h for h in [
                "Content-Security-Policy",
                "X-Frame-Options",
                "X-Content-Type-Options",
                "Strict-Transport-Security",
                "Referrer-Policy"
            ] if h not in r.headers]
            if missing:
                findings.append({
                    "id": f"V08h-{sid}", "vulnId": "V-08",
                    "name": "Missing HTTP Security Headers",
                    "severity": "MEDIUM",
                    "evidence": "Missing headers:\n" +
                                "\n".join(f"  - {h}" for h in missing),
                    "fixStatus": "pending"
                })
            if "Server" in r.headers:
                findings.append({
                    "id": f"V09s-{sid}", "vulnId": "V-09b",
                    "name": "Server Version Disclosure",
                    "severity": "LOW",
                    "evidence": f"Server: {r.headers['Server']}\n"
                                "Attackers can look up CVEs for this version.",
                    "fixStatus": "pending"
                })
            if target_url.startswith("http://"):
                findings.append({
                    "id": f"V11-{sid}", "vulnId": "V-11",
                    "name": "No HTTPS — Unencrypted Connection",
                    "severity": "HIGH",
                    "evidence": "Site serves over plain HTTP.\n"
                                "Passwords and data transmitted in plaintext.",
                    "fixStatus": "pending"
                })
            # Cookie flags
            for cookie in r.cookies:
                if not cookie.secure:
                    findings.append({
                        "id": f"V08c-{sid}", "vulnId": "V-08c",
                        "name": "Insecure Cookie — Missing Secure Flag",
                        "severity": "MEDIUM",
                        "evidence": f"Cookie '{cookie.name}' lacks Secure/HttpOnly flags.\n"
                                    "Can be stolen over HTTP or via XSS.",
                        "fixStatus": "pending"
                    })
                    break
        except Exception:
            pass

        # ── 4A. AGGRESSIVE (DVWA / lab targets) ─────────
        if is_local:
            set_status(sid, 50, "Authenticating with DVWA...")
            session = req.Session()
            try:
                session.post(
                    f"{target_url}/login.php",
                    data={"username": "admin", "password": "password", "Login": "Login"},
                    allow_redirects=True, timeout=5
                )
                session.get(
                    f"{target_url}/security.php",
                    params={"seclev_submit": "Submit", "security": "low"},
                    timeout=5
                )
            except Exception:
                pass

            # SQLMap
            set_status(sid, 58, "Running SQLMap SQL injection test...")
            sqlmap_dir = f"{scan_dir}/sqlmap"
            try:
                subprocess.run([
                    "sqlmap",
                    "-u", f"{target_url}/vulnerabilities/sqli/?id=1&Submit=Submit",
                    "--batch", "--level=1", "--risk=1",
                    "--output-dir", sqlmap_dir
                ], capture_output=True, timeout=180)
                sqlmap_text = ""
                for root, dirs, files in os.walk(sqlmap_dir):
                    for file in files:
                        if file.endswith(".log"):
                            with open(os.path.join(root, file)) as f:
                                sqlmap_text += f.read()
                if "injectable" in sqlmap_text or "parameter" in sqlmap_text:
                    findings.append({
                        "id": f"V01-{sid}", "vulnId": "V-01",
                        "name": "SQL Injection",
                        "severity": "CRITICAL",
                        "evidence": sqlmap_text[:400],
                        "fixStatus": "pending"
                    })
            except Exception:
                pass

            # Reflected XSS
            set_status(sid, 65, "Testing XSS vulnerabilities...")
            try:
                xss = "<script>alert('VulnScope')</script>"
                r2 = session.get(
                    f"{target_url}/vulnerabilities/xss_r/",
                    params={"name": xss}, timeout=5
                )
                if xss in r2.text:
                    findings.append({
                        "id": f"V02-{sid}", "vulnId": "V-02",
                        "name": "Reflected XSS",
                        "severity": "HIGH",
                        "evidence": f"Payload reflected in response.\nPayload: {xss}",
                        "fixStatus": "pending"
                    })
            except Exception:
                pass

            # Stored XSS
            try:
                xss2 = "<script>alert('STORED')</script>"
                session.post(
                    f"{target_url}/vulnerabilities/xss_s/",
                    data={"txtName": xss2, "mtxMessage": xss2, "btnSign": "Sign+Guestbook"},
                    timeout=5
                )
                r3 = session.get(f"{target_url}/vulnerabilities/xss_s/", timeout=5)
                if xss2 in r3.text:
                    findings.append({
                        "id": f"V03-{sid}", "vulnId": "V-03",
                        "name": "Stored XSS",
                        "severity": "HIGH",
                        "evidence": "Payload persisted in guestbook. Affects all users.",
                        "fixStatus": "pending"
                    })
            except Exception:
                pass

            # Command injection
            set_status(sid, 70, "Testing command injection...")
            try:
                r4 = session.post(
                    f"{target_url}/vulnerabilities/exec/",
                    data={"ip": "127.0.0.1; id", "Submit": "Submit"},
                    timeout=5
                )
                if "uid=" in r4.text:
                    findings.append({
                        "id": f"V04-{sid}", "vulnId": "V-04",
                        "name": "Command Injection",
                        "severity": "CRITICAL",
                        "evidence": "OS command 'id' executed via ping field.\n"
                                    "Payload: 127.0.0.1; id",
                        "fixStatus": "pending"
                    })
            except Exception:
                pass

            # Directory traversal
            try:
                r5 = session.get(
                    f"{target_url}/vulnerabilities/fi/",
                    params={"page": "../../../../../../etc/passwd"},
                    timeout=5
                )
                if "root:x" in r5.text:
                    findings.append({
                        "id": f"V06-{sid}", "vulnId": "V-06",
                        "name": "Directory / Path Traversal",
                        "severity": "HIGH",
                        "evidence": "/etc/passwd read via URL parameter.\n"
                                    "Payload: ?page=../../etc/passwd",
                        "fixStatus": "pending"
                    })
            except Exception:
                pass

            # Brute force
            set_status(sid, 74, "Testing authentication strength...")
            try:
                for pwd in ["password", "123456", "admin", "letmein"]:
                    r6 = session.get(
                        f"{target_url}/vulnerabilities/brute/",
                        params={"username": "admin", "password": pwd, "Login": "Login"},
                        timeout=5
                    )
                    if "Welcome to the password" in r6.text:
                        findings.append({
                            "id": f"V07-{sid}", "vulnId": "V-07",
                            "name": "Broken Authentication / No Rate Limiting",
                            "severity": "HIGH",
                            "evidence": f"Login cracked with: '{pwd}'\n"
                                        "No account lockout detected after multiple attempts.",
                            "fixStatus": "pending"
                        })
                        break
            except Exception:
                pass

            # CSRF
            try:
                r7 = session.get(f"{target_url}/vulnerabilities/csrf/", timeout=5)
                if "user_token" not in r7.text:
                    findings.append({
                        "id": f"V10-{sid}", "vulnId": "V-10",
                        "name": "CSRF Token Missing",
                        "severity": "MEDIUM",
                        "evidence": "Password change form has no CSRF token.\n"
                                    "Attackers can force password changes silently.",
                        "fixStatus": "pending"
                    })
            except Exception:
                pass

        # ── 4B. PASSIVE (any real website) ──────────────
        else:
            set_status(sid, 55, "Passive scan — checking external target...")

            # SSL certificate check
            if "https" in target_url:
                try:
                    ctx = ssl.create_default_context()
                    with ctx.wrap_socket(
                        socket.socket(), server_hostname=host
                    ) as s:
                        s.settimeout(5)
                        s.connect((host, 443))
                        cert = s.getpeercert()
                        expiry = datetime.strptime(
                            cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
                        days = (expiry - datetime.now()).days
                        if days < 30:
                            findings.append({
                                "id": f"V13-{sid}", "vulnId": "V-13",
                                "name": "SSL Certificate Expiring Soon",
                                "severity": "HIGH" if days < 7 else "MEDIUM",
                                "evidence": f"SSL cert expires in {days} days "
                                            f"({expiry.strftime('%Y-%m-%d')}).\n"
                                            "Expired certs break HTTPS.",
                                "fixStatus": "pending"
                            })
                except Exception:
                    pass

            # Sensitive files
            set_status(sid, 65, "Checking for exposed sensitive files...")
            sensitive_files = [
                ("/.env",          "CRITICAL", "May contain DB passwords and API keys"),
                ("/.git/HEAD",     "CRITICAL", "Git repo exposed — source code accessible"),
                ("/phpinfo.php",   "HIGH",     "PHP info page leaks server config"),
                ("/config.php",    "HIGH",     "Config file may contain credentials"),
                ("/wp-config.php", "HIGH",     "WordPress DB credentials exposed"),
                ("/backup.zip",    "HIGH",     "Backup archive — source code exposed"),
                ("/backup.sql",    "CRITICAL", "Database dump exposed publicly"),
                ("/.htpasswd",     "HIGH",     "Password file publicly accessible"),
                ("/phpmyadmin",    "MEDIUM",   "phpMyAdmin panel exposed"),
                ("/admin",         "LOW",      "Admin panel accessible"),
            ]
            for fpath, sev, desc in sensitive_files:
                try:
                    test_r = req.get(
                        target_url.rstrip("/") + fpath,
                        timeout=4, verify=False, allow_redirects=False
                    )
                    if test_r.status_code == 200 and len(test_r.text) > 30:
                        findings.append({
                            "id": f"V14{fpath.replace('/', '_')}-{sid}",
                            "vulnId": "V-14",
                            "name": f"Exposed Sensitive File: {fpath}",
                            "severity": sev,
                            "evidence": f"URL: {target_url.rstrip('/')}{fpath}\n{desc}",
                            "fixStatus": "pending"
                        })
                except Exception:
                    pass

            # robots.txt
            try:
                rob = req.get(f"{target_url}/robots.txt", timeout=5, verify=False)
                if rob.status_code == 200:
                    sensitive = [
                        line for line in rob.text.split("\n")
                        if any(x in line.lower() for x in
                               ["admin", "login", "config", "backup", "secret", "private"])
                    ]
                    if sensitive:
                        findings.append({
                            "id": f"V12-{sid}", "vulnId": "V-12",
                            "name": "Sensitive Paths in robots.txt",
                            "severity": "LOW",
                            "evidence": "robots.txt discloses: " +
                                        " | ".join(sensitive[:4]),
                            "fixStatus": "pending"
                        })
            except Exception:
                pass

        # ── 5. AI ANALYSIS ──────────────────────────────
        set_status(sid, 80, "AI is analysing findings and generating fix code...")
        ai_text = call_ai(target_url, findings, mode)

        # ── 6. PDF ──────────────────────────────────────
        set_status(sid, 93, "Generating PDF report...")
        pdf_path = f"{OUTPUT_DIR}/report_{sid}.pdf"
        make_pdf(target_url, findings, ai_text, pdf_path, mode)

        # ── SAVE TO DB ──────────────────────────────────
        sev = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for f in findings:
            s = f.get("severity", "LOW")
            if s in sev:
                sev[s] += 1

        conn = get_db()
        conn.execute("""UPDATE scans SET
            status='done', progress=100,
            message='Scan complete',
            findings=?, ai_analysis=?,
            findings_count=?,
            critical=?, high=?, medium=?, low=?
            WHERE id=?""",
            (json.dumps(findings), ai_text, len(findings),
             sev["CRITICAL"], sev["HIGH"], sev["MEDIUM"], sev["LOW"], sid)
        )
        conn.commit()
        conn.close()

    except Exception as e:
        conn = get_db()
        conn.execute("UPDATE scans SET status='error',message=? WHERE id=?",
                     (str(e), sid))
        conn.commit()
        conn.close()

# ════════════════════════════════════════════════════
# AI — OPENROUTER
# ════════════════════════════════════════════════════
def call_ai(target_url, findings, mode="passive"):
    try:
        client = OpenAI(
            api_key=OPENROUTER_KEY,
            base_url="https://openrouter.ai/api/v1"
        )
        prompt = f"""You are a senior penetration tester writing a professional vulnerability report.

TARGET: {target_url}
SCAN MODE: {mode}
SCAN DATE: {datetime.now().strftime("%Y-%m-%d %H:%M")}

RAW FINDINGS:
{json.dumps(findings, indent=2)}

For EVERY finding write this EXACT structure:

---
FINDING: [Name]
SEVERITY: [CRITICAL / HIGH / MEDIUM / LOW]
CVSS SCORE: [score]/10

WHAT IS THIS:
[2-3 sentences plain English explanation]

WHAT AN ATTACKER CAN DO:
[Specific realistic attack scenario — be concrete]

PROOF OF CONCEPT:
[Exact payload or method used]

EXACT FIX:
[Working code — PHP, Apache, Nginx — whatever applies]

For SQL Injection:
// VULNERABLE:
$q = "SELECT * FROM users WHERE id=" . $_GET['id'];
// FIXED:
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_GET['id']]);

For XSS:
// VULNERABLE:
echo $_GET['name'];
// FIXED:
echo htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8');

For Missing Headers (add to .htaccess):
Header always set Content-Security-Policy "default-src 'self'"
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set Strict-Transport-Security "max-age=31536000"

For Command Injection:
// VULNERABLE:
system("ping " . $_POST['ip']);
// FIXED:
$ip = $_POST['ip'];
if (!filter_var($ip, FILTER_VALIDATE_IP)) {{ die("Invalid IP"); }}
system("ping -c 4 " . escapeshellarg($ip));

For CSRF:
$_SESSION['csrf'] = bin2hex(random_bytes(32));
<input type="hidden" name="csrf" value="<?= $_SESSION['csrf'] ?>">
if (!hash_equals($_SESSION['csrf'], $_POST['csrf'])) {{ die("CSRF fail"); }}

For Brute Force:
if (!isset($_SESSION['attempts'])) {{ $_SESSION['attempts'] = 0; }}
if ($_SESSION['attempts'] >= 5) {{ die("Locked. Wait 15 minutes."); }}
// On failed login: $_SESSION['attempts']++;

OWASP REFERENCE:
[Exact OWASP link for this vulnerability]
---

Write ALL findings. Give working code for every fix. Do not skip any."""

        resp = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct:free",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
            extra_headers={
                "HTTP-Referer": "http://localhost",
                "X-Title": "VulnScope"
            }
        )
        return resp.choices[0].message.content
    except Exception as e:
        return f"AI analysis error: {str(e)}\nManual review required."

# ════════════════════════════════════════════════════
# PDF GENERATOR
# ════════════════════════════════════════════════════
def make_pdf(target_url, findings, ai_text, out, mode="passive"):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    
    COLORS = {
        "CRITICAL": (192, 57, 43),
        "HIGH": (183, 119, 13),
        "MEDIUM": (31, 92, 153),
        "LOW": (30, 104, 58)
    }
    
    def safe(text):
        if not text:
            return ""
        return str(text).encode("latin-1", "replace").decode("latin-1")
    
    try:
        # COVER PAGE
        pdf.add_page()
        pdf.set_fill_color(13, 43, 78)
        pdf.rect(0, 0, 210, 60, 'F')
        pdf.set_font("Helvetica", "B", 28)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(0, 15)
        pdf.cell(210, 15, "VulnScope", ln=True, align="C")
        pdf.set_font("Helvetica", "", 12)
        pdf.set_text_color(170, 204, 232)
        pdf.cell(210, 8, "AI-Enhanced Vulnerability Assessment Report", ln=True, align="C")
        
        # Info box
        pdf.set_fill_color(234, 243, 251)
        pdf.rect(15, 70, 180, 55, 'F')
        pdf.set_xy(20, 75)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(13, 43, 78)
        pdf.cell(0, 8, "Scan Information", ln=True)
        
        info_lines = [
            ("Target URL:", safe(target_url[:60])),
            ("Scan Date:", datetime.now().strftime("%B %d, %Y at %H:%M")),
            ("Scan Mode:", "Aggressive (Full Test)" if mode == "aggressive" else "Passive (Recon)"),
            ("Total Findings:", str(len(findings))),
        ]
        
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(44, 44, 44)
        for label, value in info_lines:
            pdf.set_x(20)
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(13, 43, 78)
            pdf.cell(45, 7, label)
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(44, 44, 44)
            pdf.cell(0, 7, value, ln=True)
        
        # Severity summary
        sev_count = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for f in findings:
            s = f.get("severity", "LOW")
            if s in sev_count:
                sev_count[s] += 1
        
        pdf.set_xy(15, 143)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(13, 43, 78)
        pdf.cell(0, 8, "Severity Overview", ln=True)
        
        # Severity boxes (fixed width)
        box_x = 15
        box_width = 42
        for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
            if box_x + box_width <= 195:  # Ensure within page
                r, g, b = COLORS[sev]
                pdf.set_fill_color(r, g, b)
                pdf.rect(box_x, 155, box_width, 28, 'F')
                pdf.set_text_color(255, 255, 255)
                pdf.set_font("Helvetica", "B", 18)
                pdf.set_xy(box_x, 157)
                pdf.cell(box_width, 12, str(sev_count[sev]), align="C")
                pdf.set_font("Helvetica", "", 8)
                pdf.set_xy(box_x, 169)
                pdf.cell(box_width, 8, sev, align="C")
                box_x += box_width + 4
        
        # Risk rating
        if sev_count["CRITICAL"] > 0:
            risk = "CRITICAL RISK"
            rc = COLORS["CRITICAL"]
        elif sev_count["HIGH"] > 0:
            risk = "HIGH RISK"
            rc = COLORS["HIGH"]
        elif sev_count["MEDIUM"] > 2:
            risk = "MEDIUM RISK"
            rc = COLORS["MEDIUM"]
        else:
            risk = "LOW RISK"
            rc = COLORS["LOW"]
        
        pdf.set_fill_color(rc[0], rc[1], rc[2])
        pdf.rect(15, 193, 180, 14, 'F')
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_xy(15, 196)
        pdf.cell(180, 9, f"Overall Risk Rating: {risk}", align="C")
        
        # FINDINGS PAGE
        if findings:
            pdf.add_page()
            pdf.set_fill_color(13, 43, 78)
            pdf.rect(0, 0, 210, 18, 'F')
            pdf.set_font("Helvetica", "B", 14)
            pdf.set_text_color(255, 255, 255)
            pdf.set_xy(0, 4)
            pdf.cell(210, 10, "Findings Summary", align="C", ln=True)
            pdf.set_y(25)
            
            # Table header
            pdf.set_fill_color(31, 92, 153)
            pdf.set_text_color(255, 255, 255)
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(20, 8, "ID", fill=True, border=1)
            pdf.cell(60, 8, "Vulnerability", fill=True, border=1)
            pdf.cell(25, 8, "Severity", fill=True, border=1)
            pdf.cell(0, 8, "Evidence", fill=True, border=1, ln=True)
            
            for i, f in enumerate(findings[:10]):  # Limit to 10 findings
                bg = (234, 243, 251) if i % 2 == 0 else (255, 255, 255)
                pdf.set_fill_color(*bg)
                pdf.set_text_color(44, 44, 44)
                pdf.set_font("Helvetica", "", 8)
                
                vid = f.get("vulnId", "")
                name = safe(f.get("name", "")[:45])
                sev = f.get("severity", "LOW")
                evidence = safe(f.get("evidence", "")[:50])
                
                r, g, b = COLORS.get(sev, (100, 100, 100))
                
                pdf.cell(20, 6, vid, fill=True, border=1)
                pdf.cell(60, 6, name, fill=True, border=1)
                
                pdf.set_fill_color(r, g, b)
                pdf.set_text_color(255, 255, 255)
                pdf.set_font("Helvetica", "B", 8)
                pdf.cell(25, 6, sev, fill=True, border=1)
                
                pdf.set_fill_color(*bg)
                pdf.set_text_color(44, 44, 44)
                pdf.set_font("Helvetica", "", 8)
                pdf.cell(0, 6, evidence, fill=True, border=1, ln=True)
        
        # EVIDENCE PAGE
        if findings:
            pdf.add_page()
            pdf.set_fill_color(13, 43, 78)
            pdf.rect(0, 0, 210, 18, 'F')
            pdf.set_font("Helvetica", "B", 14)
            pdf.set_text_color(255, 255, 255)
            pdf.set_xy(0, 4)
            pdf.cell(210, 10, "Evidence Details", align="C", ln=True)
            pdf.set_y(25)
            
            for f in findings[:5]:  # Limit to 5 findings for evidence
                sev = f.get("severity", "LOW")
                r, g, b = COLORS.get(sev, (100, 100, 100))
                pdf.set_fill_color(r, g, b)
                pdf.set_font("Helvetica", "B", 10)
                pdf.set_text_color(255, 255, 255)
                name_s = safe(f.get("name", "")[:60])
                pdf.cell(0, 7, f"  {f.get('vulnId', '')} — {name_s}", fill=True, ln=True)
                
                pdf.set_font("Courier", "", 8)
                pdf.set_text_color(40, 40, 40)
                evidence = safe(f.get("evidence", "")[:400])
                pdf.multi_cell(0, 5, evidence)
                pdf.ln(4)
        
        # Footer
        pdf.set_y(-15)
        pdf.set_font("Helvetica", "I", 7)
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 8, f"VulnScope Report | Generated {datetime.now().strftime('%Y-%m-%d')}", align="C")
        
        pdf.output(out)
        print(f"[+] PDF successfully generated: {out}")
        return True
        
    except Exception as e:
        print(f"[!] PDF Error: {e}")
        # Create emergency fallback PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 10, "VulnScope Report", ln=True)
        pdf.cell(0, 10, f"Target: {safe(target_url)}", ln=True)
        pdf.cell(0, 10, f"Findings: {len(findings)}", ln=True)
        pdf.cell(0, 10, f"Error: {safe(str(e)[:100])}", ln=True)
        pdf.output(out)
        print(f"[+] Emergency PDF created: {out}")
        return False


if __name__ == "__main__":
    print("\n  VulnScope Backend")
    print("  http://localhost:5000\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
