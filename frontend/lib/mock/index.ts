// lib/mock/index.ts
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
import {
  mockTargets,
  mockScans,
  mockVulnerabilities,
  mockReports,
  mockSettings,
  mockStats,
  mockUser,
  defaultPipelineStages,
} from './data';

// In-memory state for mock API (simulates a real backend)
let targetsDb = structuredClone(mockTargets);
let scansDb = structuredClone(mockScans);
let vulnerabilitiesDb = structuredClone(mockVulnerabilities);
let reportsDb = structuredClone(mockReports);
let settingsDb = structuredClone(mockSettings);
let sessionUser: User | null = null;
const pipelineDb = new Map<string, ScanPipelineStage[]>(
  scansDb.map((scan) => [scan.id, defaultPipelineStages()])
);

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to update reports after vulnerability changes
const updateReports = () => {
  reportsDb = reportsDb.map((report) => ({
    ...report,
    findings: vulnerabilitiesDb.filter((v) => v.scanId === report.scanId),
    summary: {
      ...report.summary,
      totalFindings: vulnerabilitiesDb.filter((v) => v.scanId === report.scanId).length,
      critical: vulnerabilitiesDb.filter((v) => v.scanId === report.scanId && v.severity === 'critical').length,
      high: vulnerabilitiesDb.filter((v) => v.scanId === report.scanId && v.severity === 'high').length,
      medium: vulnerabilitiesDb.filter((v) => v.scanId === report.scanId && v.severity === 'medium').length,
      low: vulnerabilitiesDb.filter((v) => v.scanId === report.scanId && v.severity === 'low').length,
      fixedCount: vulnerabilitiesDb.filter((v) => v.scanId === report.scanId && v.status === 'fixed').length,
      acceptedFixCount: vulnerabilitiesDb.filter((v) => v.scanId === report.scanId && v.aiFix?.accepted).length,
    },
  }));
};

const computeStats = (): DashboardStats => {
  const aiFixesAccepted = vulnerabilitiesDb.filter((v) => v.aiFix?.accepted).length;
  return {
    totalScans: scansDb.length,
    activeScans: scansDb.filter((s) => s.status === 'running').length,
    criticalVulnerabilities: vulnerabilitiesDb.filter((v) => v.severity === 'critical').length,
    unresolvedFindings: vulnerabilitiesDb.filter((v) => v.status === 'open').length,
    reportsGenerated: reportsDb.length,
    aiFixesAccepted,
    mttrAverage: 144,
    fixAcceptanceRate: vulnerabilitiesDb.filter((v) => v.aiFix).length === 0
      ? 0
      : aiFixesAccepted / vulnerabilitiesDb.filter((v) => v.aiFix).length,
  };
};

export const mockAuthApi = {
  async login(email: string, password: string): Promise<User> {
    await wait();
    if (!email || password.length < 6) throw new Error('Invalid credentials.');
    sessionUser = { ...mockUser, email, updatedAt: new Date() };
    return structuredClone(sessionUser);
  },
  async register(email: string, password: string, name: string): Promise<User> {
    await wait();
    if (!email || password.length < 8 || !name.trim()) throw new Error('Invalid data.');
    sessionUser = {
      ...mockUser,
      id: `user-${Date.now()}`,
      name,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return structuredClone(sessionUser);
  },
  async getSession(): Promise<User | null> {
    await wait(100);
    return structuredClone(sessionUser);
  },
  async logout(): Promise<void> {
    await wait(100);
    sessionUser = null;
  },
};

export const mockDashboardApi = {
  async bootstrap() {
    await wait();
    return {
      targets: structuredClone(targetsDb),
      scans: structuredClone(scansDb),
      vulnerabilities: structuredClone(vulnerabilitiesDb),
      reports: structuredClone(reportsDb),
      settings: structuredClone(settingsDb),
      stats: computeStats(),
    };
  },
  async createTarget(input: Omit<Target, 'id' | 'createdAt' | 'updatedAt'>): Promise<Target> {
    await wait();
    const target: Target = {
      ...input,
      id: `target-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    targetsDb = [target, ...targetsDb];
    return structuredClone(target);
  },
  async updateTarget(id: string, updates: Partial<Target>): Promise<Target> {
    await wait();
    let updated: Target | undefined;
    targetsDb = targetsDb.map((t) => {
      if (t.id !== id) return t;
      updated = { ...t, ...updates, updatedAt: new Date() };
      return updated;
    });
    if (!updated) throw new Error('Target not found');
    return structuredClone(updated);
  },
  async deleteTarget(id: string): Promise<void> {
    await wait();
    targetsDb = targetsDb.filter((t) => t.id !== id);
  },
  async createScan(config: ScanConfig, createdBy: string): Promise<Scan> {
    await wait();
    const scan: Scan = {
      id: `scan-${Date.now()}`,
      configId: `cfg-${Date.now()}`,
      targetId: config.targetId,
      status: 'running',
      progress: 12,
      startTime: new Date(),
      findingsCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      toolsRunning: config.tools,
      logs: [],
      createdBy,
      createdAt: new Date(),
    };
    scansDb = [scan, ...scansDb];
    pipelineDb.set(scan.id, defaultPipelineStages());
    return structuredClone(scan);
  },
  async cancelScan(scanId: string): Promise<void> {
    await wait();
    scansDb = scansDb.map((s) => (s.id === scanId ? { ...s, status: 'cancelled' } : s));
    const stages = pipelineDb.get(scanId);
    if (stages) {
      pipelineDb.set(
        scanId,
        stages.map((stage) =>
          stage.status === 'completed' ? stage : { ...stage, status: 'cancelled' }
        )
      );
    }
  },
  async getPipeline(scanId: string): Promise<ScanPipelineStage[]> {
    await wait(100);
    return structuredClone(pipelineDb.get(scanId) ?? defaultPipelineStages());
  },
  async updatePipeline(scanId: string, stages: ScanPipelineStage[]): Promise<ScanPipelineStage[]> {
    await wait(100);
    pipelineDb.set(scanId, structuredClone(stages));
    const completed = stages.filter((s) => s.status === 'completed').length;
    scansDb = scansDb.map((s) =>
      s.id === scanId
        ? {
            ...s,
            progress: Math.round((completed / stages.length) * 100),
            status: completed === stages.length ? 'completed' : s.status === 'cancelled' ? 'cancelled' : 'running',
            endTime: completed === stages.length ? new Date() : s.endTime,
          }
        : s
    );
    return structuredClone(stages);
  },
  async listReports(): Promise<Report[]> {
    await wait();
    return structuredClone(reportsDb);
  },
  async getReportByScanId(scanId: string): Promise<Report | null> {
    await wait(100);
    return structuredClone(reportsDb.find((r) => r.scanId === scanId) ?? null);
  },
  async updateSettings(settings: UserSettings): Promise<UserSettings> {
    await wait();
    settingsDb = structuredClone(settings);
    return structuredClone(settingsDb);
  },
  async acceptAiFix(vulnerabilityId: string, userName: string): Promise<Vulnerability> {
    await wait();
    vulnerabilitiesDb = vulnerabilitiesDb.map((v) => {
      if (v.id !== vulnerabilityId || !v.aiFix) return v;
      return {
        ...v,
        status: 'fixed',
        aiFix: {
          ...v.aiFix,
          accepted: true,
          acceptedAt: new Date(),
          acceptedBy: userName,
          rejectedAt: undefined,
          rejectedBy: undefined,
          rejectionReason: undefined,
        },
      };
    });
    updateReports();
    return structuredClone(vulnerabilitiesDb.find((v) => v.id === vulnerabilityId)!);
  },
  async rejectAiFix(vulnerabilityId: string, userName: string, reason?: string): Promise<Vulnerability> {
    await wait();
    vulnerabilitiesDb = vulnerabilitiesDb.map((v) => {
      if (v.id !== vulnerabilityId || !v.aiFix) return v;
      return {
        ...v,
        status: 'open',
        aiFix: {
          ...v.aiFix,
          accepted: false,
          acceptedAt: undefined,
          acceptedBy: undefined,
          rejectedAt: new Date(),
          rejectedBy: userName,
          rejectionReason: reason,
        },
      };
    });
    updateReports();
    return structuredClone(vulnerabilitiesDb.find((v) => v.id === vulnerabilityId)!);
  },
};