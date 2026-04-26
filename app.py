from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from openai import OpenAI
from fpdf import FPDF
import subprocess, requests as req
import os, json, threading, uuid, sqlite3
import hashlib, secrets
from urllib.parse import urlparse
from datetime import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True)

# ── YOUR OPENROUTER KEY ──────────────────────────────
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
        created_at TEXT
    )""")
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
    token = r.headers.get("Authorization","").replace("Bearer ","").strip()
    if not token:
        return None
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE token=?", (token,)
    ).fetchone()
    conn.close()
    return user

# ════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════
@app.route("/auth/register", methods=["POST"])
def register():
    d = request.get_json()
    uid = new_id()
    pw  = hashlib.sha256(d["password"].encode()).hexdigest()
    tok = secrets.token_hex(32)
    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO users VALUES (?,?,?,?,?)",
            (uid, d["email"], pw, d.get("name","User"), tok)
        )
        conn.commit()
        conn.close()
        return jsonify({
            "user": {"id":uid,"email":d["email"],"name":d.get("name","User")},
            "token": tok
        })
    except sqlite3.IntegrityError:
        return jsonify({"error":"Email already exists"}), 409

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
        return jsonify({"error":"Wrong email or password"}), 401
    tok = secrets.token_hex(32)
    conn.execute("UPDATE users SET token=? WHERE id=?", (tok, user["id"]))
    conn.commit()
    conn.close()
    return jsonify({
        "user": {"id":user["id"],"email":user["email"],"name":user["name"]},
        "token": tok
    })

@app.route("/auth/me", methods=["GET"])
def me():
    user = get_user(request)
    if not user:
        return jsonify({"error":"Unauthorized"}), 401
    return jsonify({"id":user["id"],"email":user["email"],"name":user["name"]})

@app.route("/auth/logout", methods=["POST"])
def logout():
    user = get_user(request)
    if user:
        conn = get_db()
        conn.execute("UPDATE users SET token='' WHERE id=?", (user["id"],))
        conn.commit()
        conn.close()
    return jsonify({"message":"Logged out"})

# ════════════════════════════════════════════════════
# DASHBOARD
# ════════════════════════════════════════════════════
@app.route("/dashboard/bootstrap", methods=["GET"])
def bootstrap():
    user = get_user(request)
    if not user:
        return jsonify({"error":"Unauthorized"}), 401
    uid = user["id"]
    conn = get_db()

    targets = [dict(r) for r in conn.execute(
        "SELECT * FROM targets WHERE user_id=?", (uid,)
    ).fetchall()]

    scans_raw = conn.execute(
        "SELECT * FROM scans WHERE user_id=? ORDER BY created_at DESC",
        (uid,)
    ).fetchall()
    conn.close()

    scans    = []
    vulns    = []
    reports  = []

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
                "findingsCount":sd["findings_count"],
            })

    total_vulns = len(vulns)
    crits = sum(1 for v in vulns if v.get("severity")=="CRITICAL")

    return jsonify({
        "targets":         targets,
        "scans":           scans,
        "vulnerabilities": vulns,
        "reports":         reports,
        "settings":        {"notifications":True,"autoScan":False},
        "stats": {
            "totalScans":    len(scans),
            "totalVulns":    total_vulns,
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
        return jsonify({"error":"Unauthorized"}), 401
    d   = request.get_json()
    tid = new_id()
    now = datetime.now().isoformat()
    conn = get_db()
    conn.execute("INSERT INTO targets VALUES (?,?,?,?,?)",
        (tid, user["id"], d.get("url",""), d.get("name","Target"), now))
    conn.commit()
    conn.close()
    return jsonify({"id":tid,"url":d.get("url"),"name":d.get("name","Target"),"createdAt":now})

@app.route("/targets/<tid>", methods=["PUT"])
def update_target(tid):
    user = get_user(request)
    if not user:
        return jsonify({"error":"Unauthorized"}), 401
    d = request.get_json()
    conn = get_db()
    conn.execute("UPDATE targets SET url=?,name=? WHERE id=? AND user_id=?",
        (d.get("url"), d.get("name"), tid, user["id"]))
    conn.commit()
    conn.close()
    return jsonify({"id":tid,**d})

@app.route("/targets/<tid>", methods=["DELETE"])
def delete_target(tid):
    user = get_user(request)
    if not user:
        return jsonify({"error":"Unauthorized"}), 401
    conn = get_db()
    conn.execute("DELETE FROM targets WHERE id=? AND user_id=?", (tid, user["id"]))
    conn.commit()
    conn.close()
    return jsonify({"message":"Deleted"})

# ════════════════════════════════════════════════════
# SCANS
# ════════════════════════════════════════════════════
@app.route("/scans", methods=["POST"])
def create_scan():
    user = get_user(request)
    if not user:
        return jsonify({"error":"Unauthorized"}), 401
    d   = request.get_json()
    url = d.get("targetUrl") or d.get("url","")
    sid = new_id()
    now = datetime.now().isoformat()
    conn = get_db()
    conn.execute(
        "INSERT INTO scans VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (sid, user["id"], url, "running", 0,
         "Starting...", "[]", "", 0,0,0,0,0, now)
    )
    conn.commit()
    conn.close()
    t = threading.Thread(target=run_scan, args=(sid, url))
    t.daemon = True
    t.start()
    return jsonify({
        "id":sid,"targetUrl":url,
        "status":"running","progress":0,
        "message":"Scan started","createdAt":now
    })

@app.route("/scans/<sid>/pipeline", methods=["GET"])
def pipeline(sid):
    conn = get_db()
    scan = conn.execute("SELECT * FROM scans WHERE id=?", (sid,)).fetchone()
    conn.close()
    if not scan:
        return jsonify({"error":"Not found"}), 404
    p = scan["progress"]
    stages = [
        {"name":"Nmap Port Scan",    "status":"done" if p>15 else ("running" if p>0  else "pending")},
        {"name":"Nikto Web Scan",    "status":"done" if p>30 else ("running" if p>15 else "pending")},
        {"name":"Header Analysis",   "status":"done" if p>45 else ("running" if p>30 else "pending")},
        {"name":"SQLMap Injection",  "status":"done" if p>65 else ("running" if p>45 else "pending")},
        {"name":"Custom Tests",      "status":"done" if p>80 else ("running" if p>65 else "pending")},
        {"name":"AI Analysis",       "status":"done" if p>92 else ("running" if p>80 else "pending")},
        {"name":"PDF Generation",    "status":"done" if p>=100 else ("running" if p>92 else "pending")},
    ]
    return jsonify({
        "scanId":       sid,
        "status":       scan["status"],
        "progress":     scan["progress"],
        "message":      scan["message"],
        "stages":       stages,
        "findingsCount":scan["findings_count"],
        "critical":     scan["critical"],
        "high":         scan["high"],
        "medium":       scan["medium"],
        "low":          scan["low"],
    })

# ════════════════════════════════════════════════════
# REPORTS
# ════════════════════════════════════════════════════
@app.route("/reports/<sid>", methods=["GET"])
def download_report(sid):
    path = os.path.abspath(f"{OUTPUT_DIR}/report_{sid}.pdf")
    if not os.path.exists(path):
        # also check root folder
        alt_path = os.path.abspath(f"report_{sid}.pdf")
        if os.path.exists(alt_path):
            path = alt_path
        else:
            return jsonify({"error": f"Report not found: {sid}"}), 404
    response = send_file(
        path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"vulnscope_report_{sid}.pdf"
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    return response
# ════════════════════════════════════════════════════
# FINDINGS
# ════════════════════════════════════════════════════
@app.route("/findings/<fid>/accept-fix", methods=["POST"])
def accept_fix(fid):
    return jsonify({"id":fid,"fixStatus":"accepted"})

@app.route("/findings/<fid>/reject-fix", methods=["POST"])
def reject_fix(fid):
    return jsonify({"id":fid,"fixStatus":"rejected"})

@app.route("/settings", methods=["POST"])
def settings():
    return jsonify({"message":"Saved"})

# ════════════════════════════════════════════════════
# SCAN ENGINE
# ════════════════════════════════════════════════════
def set_status(sid, progress, message):
    conn = get_db()
    conn.execute(
        "UPDATE scans SET progress=?,message=? WHERE id=?",
        (progress, message, sid)
    )
    conn.commit()
    conn.close()

def run_scan(sid, target_url):
    findings = []
    host = urlparse(target_url).hostname
    scan_dir = f"{OUTPUT_DIR}/{sid}"
    os.makedirs(scan_dir, exist_ok=True)

    is_local = any(x in (target_url or "") for x in
                   ["localhost","127.0.0.1","192.168.","dvwa"])
    try:
        # ── 1. NMAP ──────────────────────────────────
        set_status(sid, 10, "Running Nmap port scan...")
        nmap_file = f"{scan_dir}/nmap.xml"
        try:
            subprocess.run(
                ["nmap","-sV","--top-ports","100","-oX",nmap_file,host],
                capture_output=True, timeout=120
            )
        except:
            pass

        if os.path.exists(nmap_file):
            with open(nmap_file) as f:
                nmap_text = f.read()
            cnt = nmap_text.count('state="open"')
            if cnt > 0:
                findings.append({
                    "id":f"V09-{sid}","vulnId":"V-09",
                    "name":"Open Ports Detected",
                    "severity":"HIGH",
                    "evidence":f"{cnt} open ports found\n{nmap_text[:300]}",
                    "fixStatus":"pending"
                })

        # ── 2. NIKTO ─────────────────────────────────
        set_status(sid, 25, "Running Nikto web scan...")
        nikto_file = f"{scan_dir}/nikto.txt"
        try:
            subprocess.run(
                ["nikto","-h",target_url,"-o",nikto_file,
                 "-Format","txt","-maxtime","60"],
                capture_output=True, timeout=120
            )
        except:
            pass

        if os.path.exists(nikto_file):
            with open(nikto_file) as f:
                nikto_text = f.read()
            if "X-Frame-Options" in nikto_text or \
               "Content-Security-Policy" in nikto_text:
                findings.append({
                    "id":f"V08n-{sid}","vulnId":"V-08",
                    "name":"Nikto: Missing Security Headers",
                    "severity":"MEDIUM",
                    "evidence":nikto_text[:300],
                    "fixStatus":"pending"
                })

        # ── 3. HEADER CHECK ──────────────────────────
        set_status(sid, 40, "Checking HTTP security headers...")
        try:
            import urllib3
            urllib3.disable_warnings()
            r = req.get(target_url, timeout=10, verify=False)
            missing = [h for h in [
                "Content-Security-Policy","X-Frame-Options",
                "X-Content-Type-Options","Strict-Transport-Security"
            ] if h not in r.headers]
            if missing:
                findings.append({
                    "id":f"V08-{sid}","vulnId":"V-08",
                    "name":"Missing HTTP Security Headers",
                    "severity":"MEDIUM",
                    "evidence":f"Missing: {', '.join(missing)}",
                    "fixStatus":"pending"
                })
            if "Server" in r.headers:
                findings.append({
                    "id":f"V09b-{sid}","vulnId":"V-09b",
                    "name":"Server Version Disclosure",
                    "severity":"LOW",
                    "evidence":f"Server header: {r.headers['Server']}",
                    "fixStatus":"pending"
                })
            if target_url.startswith("http://"):
                findings.append({
                    "id":f"V11-{sid}","vulnId":"V-11",
                    "name":"No HTTPS / Unencrypted Connection",
                    "severity":"HIGH",
                    "evidence":"Site served over HTTP. All data is in plaintext.",
                    "fixStatus":"pending"
                })
        except:
            pass

        # ── 4A. AGGRESSIVE TESTS (DVWA/local only) ───
        if is_local:
            set_status(sid, 50, "Logging into DVWA...")
            session = req.Session()
            try:
                session.post(
                    f"{target_url}/login.php",
                    data={"username":"admin","password":"password","Login":"Login"},
                    allow_redirects=True, timeout=5
                )
                session.get(
                    f"{target_url}/security.php",
                    params={"seclev_submit":"Submit","security":"low"},
                    timeout=5
                )
            except:
                pass

            # SQLMap
            set_status(sid, 58, "Running SQLMap...")
            sqlmap_dir = f"{scan_dir}/sqlmap"
            try:
                subprocess.run([
                    "sqlmap",
                    "-u",f"{target_url}/vulnerabilities/sqli/?id=1&Submit=Submit",
                    "--batch","--level=1","--risk=1",
                    "--output-dir",sqlmap_dir
                ], capture_output=True, timeout=180)
                sqlmap_text = ""
                for root,dirs,files in os.walk(sqlmap_dir):
                    for file in files:
                        if file.endswith(".log"):
                            with open(os.path.join(root,file)) as f:
                                sqlmap_text += f.read()
                if "injectable" in sqlmap_text or "parameter" in sqlmap_text:
                    findings.append({
                        "id":f"V01-{sid}","vulnId":"V-01",
                        "name":"SQL Injection",
                        "severity":"CRITICAL",
                        "evidence":sqlmap_text[:300],
                        "fixStatus":"pending"
                    })
            except:
                pass

            # XSS reflected
            set_status(sid, 67, "Testing XSS...")
            try:
                xss = "<script>alert('VulnScope')</script>"
                r = session.get(
                    f"{target_url}/vulnerabilities/xss_r/",
                    params={"name":xss}, timeout=5
                )
                if xss in r.text:
                    findings.append({
                        "id":f"V02-{sid}","vulnId":"V-02",
                        "name":"Reflected XSS",
                        "severity":"HIGH",
                        "evidence":"XSS payload reflected in response",
                        "fixStatus":"pending"
                    })
            except:
                pass

            # Stored XSS
            try:
                xss2 = "<script>alert('STORED')</script>"
                session.post(
                    f"{target_url}/vulnerabilities/xss_s/",
                    data={"txtName":xss2,"mtxMessage":xss2,"btnSign":"Sign+Guestbook"},
                    timeout=5
                )
                r2 = session.get(f"{target_url}/vulnerabilities/xss_s/", timeout=5)
                if xss2 in r2.text:
                    findings.append({
                        "id":f"V03-{sid}","vulnId":"V-03",
                        "name":"Stored XSS",
                        "severity":"HIGH",
                        "evidence":"Payload stored and reflected to all users",
                        "fixStatus":"pending"
                    })
            except:
                pass

            # Command injection
            try:
                r = session.post(
                    f"{target_url}/vulnerabilities/exec/",
                    data={"ip":"127.0.0.1; id","Submit":"Submit"},
                    timeout=5
                )
                if "uid=" in r.text:
                    findings.append({
                        "id":f"V04-{sid}","vulnId":"V-04",
                        "name":"Command Injection",
                        "severity":"CRITICAL",
                        "evidence":"OS command executed via ping field",
                        "fixStatus":"pending"
                    })
            except:
                pass

            # Directory traversal
            try:
                r = session.get(
                    f"{target_url}/vulnerabilities/fi/",
                    params={"page":"../../../../../../etc/passwd"},
                    timeout=5
                )
                if "root:x" in r.text:
                    findings.append({
                        "id":f"V06-{sid}","vulnId":"V-06",
                        "name":"Directory Traversal",
                        "severity":"HIGH",
                        "evidence":"/etc/passwd read via URL parameter",
                        "fixStatus":"pending"
                    })
            except:
                pass

            # Brute force
            try:
                for pwd in ["password","123456","admin","letmein"]:
                    r = session.get(
                        f"{target_url}/vulnerabilities/brute/",
                        params={"username":"admin","password":pwd,"Login":"Login"},
                        timeout=5
                    )
                    if "Welcome to the password" in r.text:
                        findings.append({
                            "id":f"V07-{sid}","vulnId":"V-07",
                            "name":"Broken Authentication / Brute Force",
                            "severity":"HIGH",
                            "evidence":f"Login cracked with: {pwd}. No lockout.",
                            "fixStatus":"pending"
                        })
                        break
            except:
                pass

            # CSRF
            try:
                r = session.get(f"{target_url}/vulnerabilities/csrf/", timeout=5)
                if "user_token" not in r.text:
                    findings.append({
                        "id":f"V10-{sid}","vulnId":"V-10",
                        "name":"CSRF Token Missing",
                        "severity":"MEDIUM",
                        "evidence":"Password change form has no CSRF token",
                        "fixStatus":"pending"
                    })
            except:
                pass

        # ── 4B. PASSIVE (real websites) ───────────────
        else:
            set_status(sid, 65, "Checking exposed sensitive files...")
            exposed = []
            for path in ["/.env","/.git/HEAD","/phpinfo.php",
                         "/config.php","/backup.zip","/wp-config.php",
                         "/admin","/phpmyadmin"]:
                try:
                    r = req.get(target_url+path, timeout=3, verify=False)
                    if r.status_code == 200 and len(r.text) > 50:
                        exposed.append(path)
                except:
                    pass
            if exposed:
                findings.append({
                    "id":f"V14-{sid}","vulnId":"V-14",
                    "name":"Sensitive Files Exposed",
                    "severity":"CRITICAL",
                    "evidence":f"Accessible paths: {', '.join(exposed)}",
                    "fixStatus":"pending"
                })

            # robots.txt check
            try:
                r = req.get(f"{target_url}/robots.txt", timeout=5)
                if r.status_code == 200:
                    sensitive = [l for l in r.text.split("\n")
                                 if any(x in l.lower() for x in
                                        ["admin","login","config","backup","secret"])]
                    if sensitive:
                        findings.append({
                            "id":f"V12-{sid}","vulnId":"V-12",
                            "name":"Sensitive Paths in robots.txt",
                            "severity":"LOW",
                            "evidence":"robots.txt reveals: " + ", ".join(sensitive[:3]),
                            "fixStatus":"pending"
                        })
            except:
                pass

        # ── 5. AI ANALYSIS ────────────────────────────
        set_status(sid, 82, "AI is analysing findings...")
        ai_text = call_ai(target_url, findings)

        # ── 6. PDF ────────────────────────────────────
        set_status(sid, 93, "Generating PDF report...")
        pdf_path = f"{OUTPUT_DIR}/report_{sid}.pdf"
        make_pdf(target_url, findings, ai_text, pdf_path)

        # ── SAVE ─────────────────────────────────────
        sev = {"CRITICAL":0,"HIGH":0,"MEDIUM":0,"LOW":0}
        for f in findings:
            s = f.get("severity","LOW")
            sev[s] = sev.get(s,0)+1

        conn = get_db()
        conn.execute("""UPDATE scans SET
            status='done', progress=100,
            message='Scan complete',
            findings=?, ai_analysis=?,
            findings_count=?,
            critical=?,high=?,medium=?,low=?
            WHERE id=?
        """, (
            json.dumps(findings), ai_text,
            len(findings),
            sev["CRITICAL"],sev["HIGH"],
            sev["MEDIUM"],sev["LOW"],
            sid
        ))
        conn.commit()
        conn.close()

    except Exception as e:
        conn = get_db()
        conn.execute(
            "UPDATE scans SET status='error',message=? WHERE id=?",
            (str(e), sid)
        )
        conn.commit()
        conn.close()

# ════════════════════════════════════════════════════
# AI — OPENROUTER
# ════════════════════════════════════════════════════
def call_ai(target_url, findings):
    try:
        client = OpenAI(
            api_key=OPENROUTER_KEY,
            base_url="https://openrouter.ai/api/v1"
        )

        findings_text = json.dumps(findings, indent=2)

        prompt = f"""You are a senior penetration tester writing a professional vulnerability report.

TARGET: {target_url}
SCAN DATE: {datetime.now().strftime("%Y-%m-%d %H:%M")}

RAW FINDINGS FROM AUTOMATED TOOLS:
{findings_text}

For EVERY single finding listed above, write a detailed section using EXACTLY this format:

---
FINDING: [Finding Name]
SEVERITY: [CRITICAL / HIGH / MEDIUM / LOW]
CVSS SCORE: [score out of 10]

WHAT IS THIS:
[2-3 sentences explaining what this vulnerability is in plain English that a developer can understand]

WHAT AN ATTACKER CAN DO:
[Specific, realistic attack scenario. What exactly happens if exploited. Be concrete.]

PROOF OF CONCEPT:
[Show the exact payload or method used to confirm this vulnerability]

EXACT FIX:
[This is the most important part. Give the actual code fix.]

For SQL Injection — give fixed PHP code using PDO:
```php
// VULNERABLE (what they have now):
$query = "SELECT * FROM users WHERE id=" . $_GET['id'];

// FIXED (what they should use):
$pdo = new PDO('mysql:host=localhost;dbname=dvwa', $user, $pass);
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_GET['id']]);
$result = $stmt->fetchAll();
```

For XSS — give the exact output encoding fix:
```php
// VULNERABLE:
echo $_GET['name'];

// FIXED:
echo htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8');
```

For Missing Headers — give the exact Apache/Nginx config:
```apache
# Add to .htaccess or Apache config:
Header always set Content-Security-Policy "default-src 'self'"
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set Strict-Transport-Security "max-age=31536000"
```

For Command Injection — give the fix:
```php
// VULNERABLE:
system("ping " . $_POST['ip']);

// FIXED — whitelist validation:
$ip = $_POST['ip'];
if (!filter_var($ip, FILTER_VALIDATE_IP)) {{
    die("Invalid IP address");
}}
system("ping -c 4 " . escapeshellarg($ip));
```

For CSRF — give the token implementation:
```php
// Generate token on page load:
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// In form:
<input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">

// Validate on submit:
if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {{
    die("CSRF token mismatch");
}}
```

For Directory Traversal:
```php
// VULNERABLE:
include($_GET['page']);

// FIXED — whitelist allowed files only:
$allowed = ['home', 'about', 'contact'];
$page = $_GET['page'];
if (!in_array($page, $allowed)) {{
    die("Invalid page");
}}
include($page . '.php');
```

For Brute Force:
```php
// Add to login handler:
session_start();
if (!isset($_SESSION['login_attempts'])) {{
    $_SESSION['login_attempts'] = 0;
    $_SESSION['lockout_time'] = 0;
}}
if ($_SESSION['login_attempts'] >= 5) {{
    if (time() - $_SESSION['lockout_time'] < 300) {{
        die("Account locked for 5 minutes. Try again later.");
    }}
    $_SESSION['login_attempts'] = 0;
}}
// After failed login:
$_SESSION['login_attempts']++;
$_SESSION['lockout_time'] = time();
```

REFERENCES:
[Cite the relevant OWASP page for this vulnerability]
---

Write ALL findings. Do not skip any. Do not summarise. Give the actual working code for every single fix.
"""

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
        return f"AI analysis error: {str(e)}\n\nManual review required."

# ════════════════════════════════════════════════════
# PDF
# ════════════════════════════════════════════════════
def make_pdf(target_url, findings, ai_text, out):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ── COVER PAGE ───────────────────────────────────
    pdf.add_page()
    
    # Dark header bar
    pdf.set_fill_color(13, 43, 78)
    pdf.rect(0, 0, 210, 60, 'F')
    
    pdf.set_font("Arial", "B", 28)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(0, 15)
    pdf.cell(210, 15, "VulnScope", ln=True, align="C")
    
    pdf.set_font("Arial", "", 13)
    pdf.set_text_color(170, 204, 232)
    pdf.cell(210, 8, "AI-Enhanced Vulnerability Assessment Report", 
             ln=True, align="C")

    # Info box
    pdf.set_fill_color(234, 243, 251)
    pdf.rect(15, 70, 180, 55, 'F')
    
    pdf.set_font("Arial", "B", 11)
    pdf.set_text_color(13, 43, 78)
    pdf.set_xy(20, 75)
    pdf.cell(0, 8, "Scan Information", ln=True)
    
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(44, 44, 44)
    pdf.set_x(20)
    pdf.cell(40, 7, "Target URL:", )
    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 7, target_url[:60], ln=True)
    
    pdf.set_font("Arial", "", 10)
    pdf.set_x(20)
    pdf.cell(40, 7, "Scan Date:")
    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 7, datetime.now().strftime("%B %d, %Y at %H:%M"), ln=True)
    
    pdf.set_font("Arial", "", 10)
    pdf.set_x(20)
    pdf.cell(40, 7, "Total Findings:")
    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 7, str(len(findings)), ln=True)
    
    pdf.set_font("Arial", "", 10)
    pdf.set_x(20)
    pdf.cell(40, 7, "Scan Mode:")
    pdf.set_font("Arial", "B", 10)
    is_local = "localhost" in target_url or "192.168" in target_url
    pdf.cell(0, 7, 
             "Aggressive (Full Test)" if is_local else "Passive (Recon)",
             ln=True)

    # Severity summary boxes
    colors_map = {
        "CRITICAL": (192, 57,  43),
        "HIGH":     (183, 119, 13),
        "MEDIUM":   (31,  92,  153),
        "LOW":      (30,  104, 58)
    }
    sev_count = {"CRITICAL":0,"HIGH":0,"MEDIUM":0,"LOW":0}
    for f in findings:
        s = f.get("severity","LOW")
        sev_count[s] = sev_count.get(s, 0) + 1

    pdf.set_xy(15, 140)
    pdf.set_font("Arial", "B", 12)
    pdf.set_text_color(13, 43, 78)
    pdf.cell(0, 8, "Severity Overview", ln=True)
    
    box_x = 15
    for sev in ["CRITICAL","HIGH","MEDIUM","LOW"]:
        r, g, b = colors_map[sev]
        pdf.set_fill_color(r, g, b)
        pdf.rect(box_x, 152, 42, 28, 'F')
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Arial", "B", 18)
        pdf.set_xy(box_x, 154)
        pdf.cell(42, 12, str(sev_count[sev]), align="C")
        pdf.set_font("Arial", "", 8)
        pdf.set_xy(box_x, 166)
        pdf.cell(42, 8, sev, align="C", ln=0)
        box_x += 46

    # Risk rating
    total = len(findings)
    if sev_count["CRITICAL"] > 0:
        risk = "CRITICAL RISK"
        rc = (192, 57, 43)
    elif sev_count["HIGH"] > 2:
        risk = "HIGH RISK"
        rc = (183, 119, 13)
    elif total > 3:
        risk = "MEDIUM RISK"
        rc = (31, 92, 153)
    else:
        risk = "LOW RISK"
        rc = (30, 104, 58)

    pdf.set_fill_color(*rc)
    pdf.rect(15, 190, 180, 18, 'F')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Arial", "B", 13)
    pdf.set_xy(15, 193)
    pdf.cell(180, 10, f"Overall Risk Rating: {risk}", align="C")

    # Tools used
    pdf.set_xy(15, 218)
    pdf.set_font("Arial", "B", 11)
    pdf.set_text_color(13, 43, 78)
    pdf.cell(0, 8, "Tools Used in This Scan", ln=True)
    
    tools = [
        ("Nmap 7.94",       "Port scanning and service detection"),
        ("Nikto 2.x",       "Web server misconfiguration checks"),
        ("SQLMap 1.8",      "Automated SQL injection testing"),
        ("Python requests",  "Custom vulnerability tests (XSS, CSRF, traversal)"),
        ("OpenRouter AI",    "Vulnerability analysis and fix generation"),
    ]
    pdf.set_font("Arial", "", 9)
    pdf.set_text_color(44, 44, 44)
    for tool, desc in tools:
        pdf.set_x(15)
        pdf.set_font("Arial", "B", 9)
        pdf.cell(38, 6, tool)
        pdf.set_font("Arial", "", 9)
        pdf.cell(0, 6, desc, ln=True)

    # ── PAGE 2: FINDINGS TABLE ────────────────────────
    pdf.add_page()

    # Section header
    pdf.set_fill_color(13, 43, 78)
    pdf.rect(0, 0, 210, 18, 'F')
    pdf.set_font("Arial", "B", 14)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(0, 4)
    pdf.cell(210, 10, "Findings Summary", align="C", ln=True)

    pdf.set_y(25)

    # Table header
    pdf.set_fill_color(31, 92, 153)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Arial", "B", 9)
    pdf.cell(15,  8, "ID",            fill=True, border=1)
    pdf.cell(65,  8, "Vulnerability", fill=True, border=1)
    pdf.cell(25,  8, "Severity",      fill=True, border=1)
    pdf.cell(40,  8, "Tool",          fill=True, border=1)
    pdf.cell(0,   8, "Evidence",      fill=True, border=1, ln=True)

    tool_map = {
        "V-01":"SQLMap",         "V-02":"Python/requests",
        "V-03":"Python/requests","V-04":"Python/requests",
        "V-05":"Burp Suite",     "V-06":"Python/requests",
        "V-07":"Python/requests","V-08":"Nikto + Python",
        "V-09":"Nmap",           "V-09b":"Nmap",
        "V-10":"Python/requests","V-11":"Python/requests",
        "V-12":"Python/requests","V-14":"Python/requests",
    }

    for i, f in enumerate(findings):
        bg = (234, 243, 251) if i % 2 == 0 else (255, 255, 255)
        pdf.set_fill_color(*bg)
        pdf.set_text_color(44, 44, 44)
        pdf.set_font("Arial", "", 8)

        r2, g, b = colors_map.get(f.get("severity","LOW"), (100,100,100))
        
        vid  = f.get("vulnId","")
        name = f.get("name","")[:40]
        sev  = f.get("severity","")
        tool = tool_map.get(vid, "Multi-tool")
        evid = f.get("evidence","")[:40]

        pdf.cell(15,  7, vid,   fill=True, border=1)
        pdf.cell(65,  7, name,  fill=True, border=1)
        
        # Coloured severity cell
        pdf.set_fill_color(r2, g, b)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Arial", "B", 8)
        pdf.cell(25,  7, sev,   fill=True, border=1)
        
        pdf.set_fill_color(*bg)
        pdf.set_text_color(44, 44, 44)
        pdf.set_font("Arial", "", 8)
        pdf.cell(40,  7, tool,  fill=True, border=1)
        pdf.cell(0,   7, evid,  fill=True, border=1, ln=True)

    # ── PAGE 3+: AI ANALYSIS ─────────────────────────
    pdf.add_page()

    pdf.set_fill_color(13, 43, 78)
    pdf.rect(0, 0, 210, 18, 'F')
    pdf.set_font("Arial", "B", 14)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(0, 4)
    pdf.cell(210, 10,
             "AI-Generated Analysis & Fix Recommendations",
             align="C", ln=True)
    
    pdf.set_y(25)
    pdf.set_font("Arial", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(0, 5,
        "The following analysis was generated by an AI model "
        "(Mistral via OpenRouter) based on the raw tool outputs. "
        "Each finding includes a plain-English explanation, "
        "business risk, and exact developer-ready fix code.")
    pdf.ln(5)

    # Parse AI response and write it
    # Split by finding sections
    sections = ai_text.split("---")
    for section in sections:
        if not section.strip():
            continue

        lines = section.strip().split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                pdf.ln(2)
                continue

            # Detect headers
            if line.startswith("FINDING:"):
                pdf.ln(3)
                pdf.set_fill_color(13, 43, 78)
                pdf.set_font("Arial", "B", 11)
                pdf.set_text_color(255, 255, 255)
                safe = line.encode("latin-1","replace").decode("latin-1")
                pdf.cell(0, 8, "  " + safe, fill=True, ln=True)
                pdf.set_text_color(44, 44, 44)

            elif line.startswith("SEVERITY:"):
                sev_word = line.replace("SEVERITY:","").strip()
                r2,g,b = colors_map.get(sev_word,(100,100,100))
                pdf.set_fill_color(r2,g,b)
                pdf.set_font("Arial","B",9)
                pdf.set_text_color(255,255,255)
                safe = line.encode("latin-1","replace").decode("latin-1")
                pdf.cell(50, 6, "  " + safe, fill=True)
                pdf.ln(7)
                pdf.set_text_color(44,44,44)

            elif any(line.startswith(h) for h in [
                "WHAT IS","WHAT AN","PROOF","EXACT FIX","CVSS","REFERENCES"
            ]):
                pdf.set_font("Arial","B",10)
                pdf.set_text_color(31,92,153)
                safe = line.encode("latin-1","replace").decode("latin-1")
                pdf.cell(0, 7, safe, ln=True)
                pdf.set_text_color(44,44,44)

            elif line.startswith("```"):
                # Code block
                pdf.set_font("Courier","",8)
                pdf.set_fill_color(245,245,245)
                pdf.set_text_color(30,30,30)

            elif line.startswith("//") or line.startswith("$") or \
                 line.startswith("<") or line.startswith("Header") or \
                 "<?php" in line or "echo" in line or \
                 "session" in line.lower():
                # Code line
                pdf.set_font("Courier","",8)
                pdf.set_fill_color(240,240,240)
                pdf.set_text_color(20,80,20)
                safe = line.encode("latin-1","replace").decode("latin-1")
                pdf.cell(0, 5, "  " + safe[:100], fill=True, ln=True)
                pdf.set_font("Arial","",9)
                pdf.set_text_color(44,44,44)

            else:
                pdf.set_font("Arial","",9)
                pdf.set_text_color(44,44,44)
                safe = line.encode("latin-1","replace").decode("latin-1")
                pdf.multi_cell(0, 5, safe)

    # ── LAST PAGE: EVIDENCE ───────────────────────────
    pdf.add_page()

    pdf.set_fill_color(13,43,78)
    pdf.rect(0, 0, 210, 18, 'F')
    pdf.set_font("Arial","B",14)
    pdf.set_text_color(255,255,255)
    pdf.set_xy(0,4)
    pdf.cell(210,10,"Appendix — Raw Evidence",align="C",ln=True)
    
    pdf.set_y(25)

    for f in findings:
        r2,g,b = colors_map.get(f.get("severity","LOW"),(100,100,100))
        pdf.set_fill_color(r2,g,b)
        pdf.set_font("Arial","B",10)
        pdf.set_text_color(255,255,255)
        safe_name = f["name"].encode("latin-1","replace").decode("latin-1")
        pdf.cell(0, 7,
                 f"  {f.get('vulnId','')} — {safe_name} [{f.get('severity','')}]",
                 fill=True, ln=True)
        
        pdf.set_font("Courier","",7.5)
        pdf.set_text_color(40,40,40)
        evidence = f.get("evidence","")[:500]
        for line in evidence.split("\n"):
            safe = line.encode("latin-1","replace").decode("latin-1")
            pdf.multi_cell(0, 4, safe)
        pdf.ln(4)

    # Footer on every page
    pdf.set_y(-15)
    pdf.set_font("Arial","I",7)
    pdf.set_text_color(150,150,150)
    pdf.cell(0, 8,
             f"VulnScope Report | {target_url} | "
             f"Generated {datetime.now().strftime('%Y-%m-%d')} | "
             f"Confidential",
             align="C")

    pdf.output(out)

if __name__ == "__main__":
    print("\n  VulnScope Backend")
    print("  Running at http://localhost:5000\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
