"use client";

import { create } from "zustand";
import { dashboardApi } from "@/lib/api";
import {
  DashboardStats,
  Report,
  Scan,
  ScanConfig,
  ScanPipelineStage,
  Target,
  UserSettings,
  Vulnerability,
} from "@/lib/types";

interface DashboardBootstrap {
  targets: Target[];
  scans: Scan[];
  vulnerabilities: Vulnerability[];
  reports: Report[];
  settings: UserSettings;
  stats: DashboardStats;
}

interface DashboardStore extends DashboardBootstrap {
  initialized: boolean;
  isBootstrapping: boolean;
  isLoadingTargets: boolean;
  isLoadingScans: boolean;
  isSavingSettings: boolean;
  pipelineByScanId: Record<string, ScanPipelineStage[]>;
  selectedSeverity: string[];
  selectedStatus: string[];
  selectedTarget: string | null;
  initialize: () => Promise<void>;
  addTarget: (target: Omit<Target, "id" | "createdAt" | "updatedAt">) => Promise<Target>;
  updateTarget: (id: string, updates: Partial<Target>) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  createScan: (config: ScanConfig, createdBy: string) => Promise<Scan>;
  cancelScan: (scanId: string) => Promise<void>;
  getPipeline: (scanId: string) => Promise<ScanPipelineStage[]>;
  updatePipeline: (scanId: string, stages: ScanPipelineStage[]) => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  acceptAiFix: (vulnerabilityId: string, userName: string) => Promise<void>;
  rejectAiFix: (vulnerabilityId: string, userName: string, reason?: string) => Promise<void>;
  setSeverityFilter: (severities: string[]) => void;
  setStatusFilter: (statuses: string[]) => void;
  setTargetFilter: (targetId: string | null) => void;
  filteredVulnerabilities: () => Vulnerability[];
}

const emptySettings: UserSettings = {
  notifications: true,
  autoScan: false,
  emailReports: true,
  darkMode: true,
  twoFactor: false,
  dataRetention: 90,
};

const mergeBootstrap = (set: (partial: Partial<DashboardStore>) => void, data: DashboardBootstrap) => {
  set({
    ...data,
    initialized: true,
  });
};

export const useDashboard = create<DashboardStore>((set, get) => ({
  targets: [],
  scans: [],
  vulnerabilities: [],
  reports: [],
  settings: emptySettings,
  stats: {
    totalScans: 0,
    activeScans: 0,
    criticalVulnerabilities: 0,
    unresolvedFindings: 0,
    reportsGenerated: 0,
    aiFixesAccepted: 0,
    mttrAverage: 0,
    fixAcceptanceRate: 0,
  },
  initialized: false,
  isBootstrapping: false,
  isLoadingTargets: false,
  isLoadingScans: false,
  isSavingSettings: false,
  pipelineByScanId: {},
  selectedSeverity: [],
  selectedStatus: [],
  selectedTarget: null,

  initialize: async () => {
    if (get().initialized || get().isBootstrapping) {
      return;
    }
    set({ isBootstrapping: true });
    try {
      const data = await dashboardApi.bootstrap();
      mergeBootstrap(set, data);
    } finally {
      set({ isBootstrapping: false });
    }
  },

  addTarget: async (target) => {
    set({ isLoadingTargets: true });
    try {
      const created = await dashboardApi.createTarget(target);
      set({ targets: [created, ...get().targets] });
      return created;
    } finally {
      set({ isLoadingTargets: false });
    }
  },

  updateTarget: async (id, updates) => {
    set({ isLoadingTargets: true });
    try {
      const updated = await dashboardApi.updateTarget(id, updates);
      set({
        targets: get().targets.map((target) => (target.id === id ? updated : target)),
      });
    } finally {
      set({ isLoadingTargets: false });
    }
  },

  deleteTarget: async (id) => {
    set({ isLoadingTargets: true });
    try {
      await dashboardApi.deleteTarget(id);
      set({
        targets: get().targets.filter((target) => target.id !== id),
      });
    } finally {
      set({ isLoadingTargets: false });
    }
  },

  createScan: async (config, createdBy) => {
    set({ isLoadingScans: true });
    try {
      const scan = await dashboardApi.createScan(config, createdBy);
      const pipeline = await dashboardApi.getPipeline(scan.id);
      set({
        scans: [scan, ...get().scans],
        stats: { ...get().stats, totalScans: get().stats.totalScans + 1, activeScans: get().stats.activeScans + 1 },
        pipelineByScanId: { ...get().pipelineByScanId, [scan.id]: pipeline },
      });
      return scan;
    } finally {
      set({ isLoadingScans: false });
    }
  },

  cancelScan: async (scanId) => {
    await dashboardApi.cancelScan(scanId);
    set({
      scans: get().scans.map((scan) => (scan.id === scanId ? { ...scan, status: "cancelled" } : scan)),
    });
  },

  getPipeline: async (scanId) => {
    const existing = get().pipelineByScanId[scanId];
    if (existing) {
      return existing;
    }
    const pipeline = await dashboardApi.getPipeline(scanId);
    set({
      pipelineByScanId: {
        ...get().pipelineByScanId,
        [scanId]: pipeline,
      },
    });
    return pipeline;
  },

  updatePipeline: async (scanId, stages) => {
  const currentStages = get().pipelineByScanId[scanId];
  // Shallow compare to avoid useless updates
  if (currentStages && JSON.stringify(currentStages) === JSON.stringify(stages)) {
    return;
  }
  const pipeline = await dashboardApi.updatePipeline(scanId, stages);
  set({
    pipelineByScanId: { ...get().pipelineByScanId, [scanId]: pipeline },
    scans: get().scans.map((scan) =>
      scan.id === scanId
        ? {
            ...scan,
            progress: Math.round((pipeline.filter((stage) => stage.status === "completed").length / pipeline.length) * 100),
            status: pipeline.every((stage) => stage.status === "completed") ? "completed" : scan.status,
          }
        : scan
    ),
  });
},

  updateSettings: async (settings) => {
    set({ isSavingSettings: true });
    try {
      const saved = await dashboardApi.updateSettings(settings);
      set({ settings: saved });
    } finally {
      set({ isSavingSettings: false });
    }
  },

  acceptAiFix: async (vulnerabilityId, userName) => {
    const updated = await dashboardApi.acceptAiFix(vulnerabilityId, userName);
    if (!updated) return;
    const vulnerabilities = get().vulnerabilities.map((item) =>
      item.id === vulnerabilityId ? updated : item
    );
    set({
      vulnerabilities,
      reports: get().reports.map((report) => ({
        ...report,
        findings: vulnerabilities.filter((item) => item.scanId === report.scanId),
        summary: {
          ...report.summary,
          fixedCount: vulnerabilities.filter(
            (item) => item.scanId === report.scanId && item.status === "fixed"
          ).length,
          acceptedFixCount: vulnerabilities.filter(
            (item) => item.scanId === report.scanId && item.aiFix?.accepted
          ).length,
        },
      })),
      stats: {
        ...get().stats,
        aiFixesAccepted: vulnerabilities.filter((item) => item.aiFix?.accepted).length,
      },
    });
  },

  rejectAiFix: async (vulnerabilityId, userName, reason) => {
    const updated = await dashboardApi.rejectAiFix(vulnerabilityId, userName, reason);
    if (!updated) return;
    set({
      vulnerabilities: get().vulnerabilities.map((item) =>
        item.id === vulnerabilityId ? updated : item
      ),
    });
  },

  setSeverityFilter: (severities) => set({ selectedSeverity: severities }),
  setStatusFilter: (statuses) => set({ selectedStatus: statuses }),
  setTargetFilter: (targetId) => set({ selectedTarget: targetId }),

  filteredVulnerabilities: () => {
    const state = get();
    return state.vulnerabilities.filter((vuln) => {
      const matchesSeverity =
        state.selectedSeverity.length === 0 || state.selectedSeverity.includes(vuln.severity);
      const matchesStatus =
        state.selectedStatus.length === 0 || state.selectedStatus.includes(vuln.status);
      const matchesTarget = !state.selectedTarget || vuln.targetId === state.selectedTarget;

      return matchesSeverity && matchesStatus && matchesTarget;
    });
  },
}));
