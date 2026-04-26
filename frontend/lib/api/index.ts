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
const USE_MOCK = true; 
let authApiImpl: typeof mockAuthApi;
let dashboardApiImpl: typeof mockDashboardApi;

if (USE_MOCK) {
  authApiImpl = mockAuthApi;
  dashboardApiImpl = mockDashboardApi;
} else {
  // Real API client
  authApiImpl = {
    async login(email: string, password: string): Promise<User> {
      const data = await apiFetch<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      });
      setAuthToken(data.token);
      return data.user;
    },
    async register(email: string, password: string, name: string): Promise<User> {
      const data = await apiFetch<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
        requireAuth: false,
      });
      setAuthToken(data.token);
      return data.user;
    },
    async getSession(): Promise<User | null> {
      const token = getAuthToken();
      if (!token) return null;
      try {
        return await apiFetch<User>('/auth/me');
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
      return apiFetch('/dashboard/bootstrap');
    },
    async createTarget(input: Omit<Target, 'id' | 'createdAt' | 'updatedAt'>): Promise<Target> {
      return apiFetch('/targets', { method: 'POST', body: JSON.stringify(input) });
    },
    async updateTarget(id: string, updates: Partial<Target>): Promise<Target> {
      return apiFetch(`/targets/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    async deleteTarget(id: string): Promise<void> {
      await apiFetch(`/targets/${id}`, { method: 'DELETE' });
    },
    async createScan(config: ScanConfig, createdBy: string): Promise<Scan> {
      return apiFetch('/scans', { method: 'POST', body: JSON.stringify({ ...config, createdBy }) });
    },
    async cancelScan(scanId: string): Promise<void> {
      await apiFetch(`/scans/${scanId}/cancel`, { method: 'POST' });
    },
    async getPipeline(scanId: string): Promise<ScanPipelineStage[]> {
      return apiFetch(`/scans/${scanId}/pipeline`);
    },
    async updatePipeline(scanId: string, stages: ScanPipelineStage[]): Promise<ScanPipelineStage[]> {
      return apiFetch(`/scans/${scanId}/pipeline`, { method: 'PUT', body: JSON.stringify(stages) });
    },
    async listReports(): Promise<Report[]> {
      return apiFetch('/reports');
    },
    async getReportByScanId(scanId: string): Promise<Report | null> {
      return apiFetch(`/reports/scan/${scanId}`);
    },
    async updateSettings(settings: UserSettings): Promise<UserSettings> {
      return apiFetch('/settings', { method: 'PUT', body: JSON.stringify(settings) });
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