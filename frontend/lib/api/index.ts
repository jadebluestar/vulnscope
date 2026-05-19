// lib/api/index.ts
import {
  DashboardStats,
  Report,
  Scan,
  ScanConfig,
  ScanPipelineStage,
  Target,
  User,
  UserSettings,
  Vulnerability,
} from '@/lib/types';

// Import client functions (with types)
import { apiFetch, setAuthToken, getAuthToken } from './client';

// Import mock implementations
import { mockAuthApi, mockDashboardApi } from '@/lib/mock';

// const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const USE_MOCK = false;
let authApiImpl: typeof mockAuthApi;
let dashboardApiImpl: typeof mockDashboardApi;

if (USE_MOCK) {
  authApiImpl = mockAuthApi;
  dashboardApiImpl = mockDashboardApi;
} else {
  // Real API client
  authApiImpl = {
    async login(email: string, password: string): Promise<User> {
      const data = await apiFetch<{ user: { id: string; email: string; name: string }; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      });
      setAuthToken(data.token);
      return {
        ...data.user,
        role: "analyst",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    async register(email: string, password: string, name: string): Promise<User> {
      const data = await apiFetch<{ user: { id: string; email: string; name: string }; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
        requireAuth: false,
      });
      setAuthToken(data.token);
      return {
        ...data.user,
        role: "analyst",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    async getSession(): Promise<User | null> {
      const token = getAuthToken();
      if (!token) return null;
      try {
        const me = await apiFetch<{ id: string; email: string; name: string }>('/auth/me');
        return { ...me, role: "analyst", createdAt: new Date(), updatedAt: new Date() };
      } catch {
        return null;
      }
    },
    async logout(): Promise<void> {
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } finally {
        setAuthToken(null);
      }
    },
  };

  dashboardApiImpl = {
    async bootstrap(): Promise<{
      targets: Target[];
      scans: Scan[];
      vulnerabilities: Vulnerability[];
      reports: Report[];
      settings: UserSettings;
      stats: DashboardStats;
    }> {
      const data = await apiFetch<any>('/dashboard/bootstrap');
      const targets: Target[] = (data.targets ?? []).map((t: any) => {
        const createdAt = new Date(t.created_at ?? t.createdAt ?? new Date().toISOString());
        return {
          id: t.id,
          name: t.name ?? t.url ?? "Target",
          type: "url",
          url: t.url,
          tags: [],
          environment: "lab",
          status: "active",
          riskLevel: "medium",
          createdAt,
          updatedAt: createdAt,
        };
      });
      const scans: Scan[] = (data.scans ?? []).map((s: any) => ({
        id: s.id,
        configId: s.id,
        targetId: (targets.find((t) => t.url === s.targetUrl)?.id ?? s.targetUrl),
        status: s.status === "done" ? "completed" : s.status,
        progress: s.progress ?? 0,
        startTime: new Date(s.createdAt),
        endTime: s.status === "done" ? new Date(s.createdAt) : undefined,
        findingsCount: s.findingsCount ?? 0,
        criticalCount: s.critical ?? 0,
        highCount: s.high ?? 0,
        mediumCount: s.medium ?? 0,
        lowCount: s.low ?? 0,
        toolsRunning: [s.scanMode ?? "pipeline"],
        logs: [],
        createdBy: "user",
        createdAt: new Date(s.createdAt),
      }));
      const vulnerabilities: Vulnerability[] = (data.vulnerabilities ?? []).map((v: any) => {
        const sev = String(v.severity ?? "LOW").toLowerCase() as any;
        return {
          id: v.id,
          title: v.name,
          description: v.evidence ?? "",
          severity: sev,
          cvss: v.severity === "CRITICAL" ? 9.0 : v.severity === "HIGH" ? 7.5 : v.severity === "MEDIUM" ? 5.5 : 3.0,
          owasp: { category: "OWASP", id: v.vulnId ?? "V-UNK", description: v.name ?? "" },
          endpoint: "",
          evidence: [{ type: "log", content: v.evidence ?? "", timestamp: new Date(), tool: "scanner" }],
          discoveredAt: new Date(),
          discoveredBy: "VulnScope",
          status: "open",
          exploitability: "medium",
          impact: v.name ?? "",
          scanId: v.scanId,
          targetId: scans.find((s) => s.id === v.scanId)?.targetId ?? "",
        };
      });
      const reports: Report[] = (data.reports ?? []).map((r: any) => ({
        id: r.id,
        scanId: r.scanId,
        targetId: targets.find((t) => t.url === r.targetUrl)?.id ?? r.targetUrl,
        title: `VulnScope Report - ${r.targetUrl}`,
        format: "pdf",
        generatedAt: new Date(r.createdAt),
        generatedBy: "VulnScope",
        findings: vulnerabilities.filter((v) => v.scanId === r.scanId),
        summary: {
          totalFindings: r.findingsCount ?? 0,
          critical: r.critical ?? 0,
          high: r.high ?? 0,
          medium: r.medium ?? 0,
          low: r.low ?? 0,
          fixedCount: 0,
          acceptedFixCount: 0,
        },
        filePath: `/reports/${r.scanId}`,
        fileSize: 0,
        downloadCount: 0,
      }));
      return { targets, scans, vulnerabilities, reports, settings: data.settings, stats: data.stats };
    },
    async createTarget(input: Omit<Target, 'id' | 'createdAt' | 'updatedAt'>): Promise<Target> {
      const created = await apiFetch<any>('/targets', { method: 'POST', body: JSON.stringify(input) });
      const now = new Date(created.createdAt ?? new Date().toISOString());
      return {
        id: created.id,
        name: created.name ?? input.name,
        type: "url",
        url: created.url ?? input.url,
        tags: [],
        environment: "lab",
        status: "active",
        riskLevel: "medium",
        createdAt: now,
        updatedAt: now,
      };
    },
    async updateTarget(id: string, updates: Partial<Target>): Promise<Target> {
      return apiFetch(`/targets/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    async deleteTarget(id: string): Promise<void> {
      await apiFetch(`/targets/${id}`, { method: 'DELETE' });
    },
    async createScan(config: ScanConfig, createdBy: string): Promise<Scan> {
      const boot = await apiFetch<any>('/dashboard/bootstrap');
      const target = (boot.targets ?? []).find((t: any) => t.id === config.targetId);
      if (!target?.url) {
        throw new Error("Selected target URL not found");
      }
      const created = await apiFetch<any>('/scans', { method: 'POST', body: JSON.stringify({ targetUrl: target.url }) });
      return {
        id: created.id,
        configId: created.id,
        targetId: config.targetId,
        status: created.status === "done" ? "completed" : created.status,
        progress: created.progress ?? 0,
        startTime: new Date(created.createdAt ?? new Date().toISOString()),
        findingsCount: created.findingsCount ?? 0,
        criticalCount: created.critical ?? 0,
        highCount: created.high ?? 0,
        mediumCount: created.medium ?? 0,
        lowCount: created.low ?? 0,
        toolsRunning: [created.scanMode ?? "pipeline"],
        logs: [],
        createdBy,
        createdAt: new Date(created.createdAt ?? new Date().toISOString()),
      };
    },
    async cancelScan(scanId: string): Promise<void> {
      throw new Error("Cancel scan is not supported by backend yet.");
    },
    async getPipeline(scanId: string): Promise<ScanPipelineStage[]> {
      const data = await apiFetch<any>(`/scans/${scanId}/pipeline`);
      return (data.stages ?? []).map((s: any, i: number) => ({
        id: `${scanId}-${i + 1}`,
        name: s.name,
        description: data.message ?? "Pipeline stage",
        status: s.status === "done" ? "completed" : s.status,
        logs: [],
      }));
    },
    async updatePipeline(scanId: string, stages: ScanPipelineStage[]): Promise<ScanPipelineStage[]> {
      return stages;
    },
    async listReports(): Promise<Report[]> {
      const rows = await apiFetch<any[]>('/reports');
      return rows.map((r: any) => ({
        id: r.id,
        scanId: r.scanId,
        targetId: r.targetUrl,
        title: `VulnScope Report - ${r.targetUrl}`,
        format: "pdf",
        generatedAt: new Date(r.createdAt),
        generatedBy: "VulnScope",
        findings: [],
        summary: {
          totalFindings: r.findingsCount ?? 0,
          critical: r.critical ?? 0,
          high: r.high ?? 0,
          medium: r.medium ?? 0,
          low: r.low ?? 0,
          fixedCount: 0,
          acceptedFixCount: 0,
        },
        filePath: `/reports/${r.scanId}`,
        fileSize: 0,
        downloadCount: 0,
      }));
    },
    async getReportByScanId(scanId: string): Promise<Report | null> {
      const boot = await apiFetch<any>('/dashboard/bootstrap');
      const report = (boot.reports ?? []).find((r: any) => r.scanId === scanId || r.id === scanId);
      if (!report) return null;
      const findings = (boot.vulnerabilities ?? [])
        .filter((v: any) => v.scanId === scanId)
        .map((v: any) => ({
          id: v.id,
          title: v.name,
          description: v.evidence ?? "",
          severity: String(v.severity ?? "LOW").toLowerCase(),
          cvss: v.severity === "CRITICAL" ? 9.0 : v.severity === "HIGH" ? 7.5 : v.severity === "MEDIUM" ? 5.5 : 3.0,
          owasp: { category: "OWASP", id: v.vulnId ?? "V-UNK", description: v.name ?? "" },
          endpoint: report.targetUrl,
          evidence: [{ type: "log", content: v.evidence ?? "", timestamp: new Date(), tool: "scanner" }],
          discoveredAt: new Date(report.createdAt),
          discoveredBy: "VulnScope",
          status: "open",
          exploitability: "medium",
          impact: v.name ?? "",
          scanId: scanId,
          targetId: report.targetUrl,
        }));
      return {
        id: report.id,
        scanId: report.scanId,
        targetId: report.targetUrl,
        title: `VulnScope Report - ${report.targetUrl}`,
        format: "pdf",
        generatedAt: new Date(report.createdAt),
        generatedBy: "VulnScope",
        findings,
        summary: {
          totalFindings: report.findingsCount ?? findings.length,
          critical: report.critical ?? 0,
          high: report.high ?? 0,
          medium: report.medium ?? 0,
          low: report.low ?? 0,
          fixedCount: 0,
          acceptedFixCount: 0,
        },
        filePath: `/reports/${scanId}`,
        fileSize: 0,
        downloadCount: 0,
      };
    },
    async updateSettings(settings: UserSettings): Promise<UserSettings> {
      await apiFetch('/settings', { method: 'POST', body: JSON.stringify(settings) });
      return settings;
    },
    async acceptAiFix(vulnerabilityId: string, userName: string): Promise<Vulnerability> {
      return apiFetch(`/findings/${vulnerabilityId}/accept-fix`, {
        method: 'POST',
        body: JSON.stringify({ userName }),
      });
    },
    async rejectAiFix(vulnerabilityId: string, userName: string, reason?: string): Promise<Vulnerability> {
      return apiFetch(`/findings/${vulnerabilityId}/reject-fix`, {
        method: 'POST',
        body: JSON.stringify({ userName, reason }),
      });
    },
  };
}

export const authApi = authApiImpl;
export const dashboardApi = dashboardApiImpl;
