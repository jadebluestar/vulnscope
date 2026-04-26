/**
 * VulnScope Core Type Definitions
 * Complete data models for the dashboard ecosystem
 */

// ============================================================================
// AUTHENTICATION & USER
// ============================================================================

export type UserRole = "admin" | "analyst" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ============================================================================
// TARGETS
// ============================================================================

export type TargetType = "url" | "ip" | "domain" | "dvwa" | "metasploitable";
export type EnvironmentLabel = "production" | "staging" | "development" | "lab";
export type TargetStatus = "active" | "inactive" | "unreachable";

export interface Target {
  id: string;
  name: string;
  type: TargetType;
  url: string;
  ipAddress?: string;
  port?: number;
  tags: string[];
  environment: EnvironmentLabel;
  status: TargetStatus;
  credentials?: {
    username?: string;
    password?: string;
    authType?: "basic" | "bearer" | "oauth";
  };
  riskLevel: "critical" | "high" | "medium" | "low";
  lastScanned?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SCANS
// ============================================================================

export type ScanType = "quick" | "full-vapt" | "web-only" | "network-only" | "exploit-validation";
export type ScanStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type ScanDepth = "light" | "medium" | "deep";

export interface ScanConfig {
  targetId: string;
  scanType: ScanType;
  depth: ScanDepth;
  tools: string[]; // e.g., ["nikto", "burp", "nessus"]
  owasvCategories?: string[];
  customPayloads?: string[];
  includeExploitation: boolean;
  maxDuration?: number; // minutes
}

export interface Scan {
  id: string;
  configId: string;
  targetId: string;
  status: ScanStatus;
  progress: number; // 0-100
  startTime: Date;
  endTime?: Date;
  findingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  toolsRunning: string[];
  logs: ScanLog[];
  createdBy: string;
  createdAt: Date;
}

export interface ScanLog {
  id: string;
  timestamp: Date;
  tool: string;
  stage: string;
  message: string;
  severity?: "info" | "warning" | "error";
}

// ============================================================================
// VULNERABILITIES / FINDINGS
// ============================================================================

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type VulnStatus = "open" | "fixed" | "ignored" | "false-positive";

export interface OWASPMapping {
  category: string;
  id: string;
  description: string;
}

export interface Evidence {
  type: "request" | "response" | "screenshot" | "log";
  content: string;
  timestamp: Date;
  tool: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  cvss: number; // 0-10
  cvssVector?: string;
  cwe?: string;
  owasp: OWASPMapping;
  endpoint: string;
  method?: string;
  parameters?: string[];
  evidence: Evidence[];
  discoveredAt: Date;
  discoveredBy: string; // tool name
  status: VulnStatus;
  aiFix?: AIRemediationSuggestion;
  exploitability: "high" | "medium" | "low";
  impact: string;
  remediation?: string;
  references?: string[];
  scanId: string;
  targetId: string;
}

// ============================================================================
// AI REMEDIATION
// ============================================================================

export interface AIRemediationSuggestion {
  id: string;
  vulnerabilityId: string;
  generatedAt: Date;
  generatedBy: string; // LLM model name
  type: "code-fix" | "config-patch" | "process-change" | "architecture";
  severity: Severity;
  confidence: number; // 0-1
  explanation: string; // Plain English risk narrative
  riskNarrative: string;
  suggestion: string;
  codeSnippet?: {
    language: string;
    before: string;
    after: string;
  };
  configPatch?: {
    file: string;
    before: string;
    after: string;
  };
  references?: string[];
  accepted: boolean;
  acceptedAt?: Date;
  acceptedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
}

// ============================================================================
// REPORTS
// ============================================================================

export type ReportFormat = "pdf" | "json" | "csv" | "html";

export interface Report {
  id: string;
  scanId: string;
  targetId: string;
  title: string;
  format: ReportFormat;
  generatedAt: Date;
  generatedBy: string;
  findings: Vulnerability[];
  summary: {
    totalFindings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    fixedCount: number;
    acceptedFixCount: number;
  };
  branding?: {
    companyName?: string;
    logo?: string;
    color?: string;
  };
  filePath: string;
  fileSize: number;
  downloadCount: number;
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface DashboardStats {
  totalScans: number;
  activeScans: number;
  criticalVulnerabilities: number;
  unresolvedFindings: number;
  reportsGenerated: number;
  aiFixesAccepted: number;
  mttrAverage: number; // minutes
  fixAcceptanceRate: number; // 0-1
}

// ============================================================================
// DASHBOARD SETTINGS
// ============================================================================

export interface UserSettings {
  notifications: boolean;
  autoScan: boolean;
  emailReports: boolean;
  darkMode: boolean;
  twoFactor: boolean;
  dataRetention: number;
}

// ============================================================================
// SCAN PIPELINE
// ============================================================================

export type PipelineStageStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface ScanPipelineStage {
  id: string;
  name: string;
  description: string;
  status: PipelineStageStatus;
  logs: string[];
  duration?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
