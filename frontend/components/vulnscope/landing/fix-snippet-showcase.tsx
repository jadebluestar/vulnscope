"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const codeExamples = [
  {
    vulnerability: "SQL Injection",
    vulnerable: `// Vulnerable code
$query = "SELECT * FROM users WHERE email='" . $_GET['email'] . "'";
$result = mysqli_query($conn, $query);`,
    fixed: `// Fixed code - Use parameterized queries
$stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
$stmt->bind_param("s", $_GET['email']);
$stmt->execute();
$result = $stmt->get_result();`,
    language: "php",
  },
  {
    vulnerability: "XSS Prevention",
    vulnerable: `<!-- Vulnerable code -->
<div>Welcome, {{ userInput }}</div>`,
    fixed: `<!-- Fixed code - Escape output -->
<div>Welcome, {{ userInput | escape }}</div>`,
    language: "html",
  },
  {
    vulnerability: "Missing Auth Header",
    vulnerable: `// Vulnerable - No auth check
app.get('/api/users', (req, res) => {
  const users = db.all();
  res.json(users);
});`,
    fixed: `// Fixed - Add auth middleware
app.get('/api/users', authMiddleware, (req, res) => {
  const users = db.all();
  res.json(users);
});`,
    language: "javascript",
  },
  {
    vulnerability: "Weak Password Policy",
    vulnerable: `// Vulnerable - No strength check
if (password.length >= 6) {
  saveUser(password);
}`,
    fixed: `// Fixed - Enforce strong passwords
const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(password);
if (isStrong) {
  saveUser(password);
}`,
    language: "javascript",
  },
];

export default function FixSnippetShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const example = codeExamples[activeTab];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section className="py-20 px-4" style={{ backgroundImage: 'linear-gradient(to bottom, rgb(15,23,42) 0%, rgb(3,7,18) 50%, rgb(15,23,42) 100%)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI-Generated Security Fixes
          </h2>
          <p className="text-lg text-dimtext max-w-2xl mx-auto">
            See exactly how VulnScope helps developers fix vulnerabilities with production-ready code
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {codeExamples.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
                activeTab === idx
                  ? "bg-amber text-bg-primary"
                  : "bg-slate-800 text-dimtext hover:bg-slate-700"
              }`}
            >
              {ex.vulnerability}
            </button>
          ))}
        </div>

        {/* Code display */}
        <div className="space-y-6">
          {/* Vulnerable code */}
          <div className="relative">
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <span className="px-2.5 py-1 text-xs font-semibold rounded bg-red-900/50 text-red-400 border border-red-500/30">
                Vulnerable
              </span>
            </div>
            <pre className="bg-[#1e1e1e] border border-red-500/30 rounded-lg p-6 overflow-x-auto text-sm leading-relaxed text-red-400/80">
              <code>{example.vulnerable}</code>
            </pre>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center">
            <div className="text-dimtext text-2xl">↓</div>
          </div>

          {/* Fixed code */}
          <div className="relative">
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <span className="px-2.5 py-1 text-xs font-semibold rounded bg-green-900/50 text-green-400 border border-green-500/30">
                Fixed
              </span>
              <button
                onClick={() => copyToClipboard(example.fixed, activeTab)}
                className="p-2 hover:bg-green-900/30 rounded transition-colors"
                title="Copy fixed code"
              >
                {copiedIndex === activeTab ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-dimtext hover:text-green-400" />
                )}
              </button>
            </div>
            <pre className="bg-[#1e1e1e] border border-green-500/30 rounded-lg p-6 overflow-x-auto text-sm leading-relaxed text-green-400/80">
              <code>{example.fixed}</code>
            </pre>
          </div>
        </div>

        {/* Info */}
        <div className="mt-12 p-6 rounded-lg border border-slate-700 bg-slate-900/50">
          <p className="text-dimtext">
            All code fixes are generated by AI analysis of the vulnerability context, endpoint, and codebase. You maintain full control over implementation and can review changes before deployment.
          </p>
        </div>
      </div>
    </section>
  );
}
