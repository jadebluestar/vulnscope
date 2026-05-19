// lib/api/client.ts
// Updated to match the provided API spec and provide
// – a consistent auth flow
// – typed helpers for each endpoint
// – robust error handling
// – explicit token persistence via localStorage

// -----------------------------------------------------------------------------
// 1. Base URL – pick the value from NEXT_PUBLIC_API_BASE_URL or fallback
// -----------------------------------------------------------------------------
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// -----------------------------------------------------------------------------
// 2. Token storage helpers – key is consistent and exposed for other modules
// -----------------------------------------------------------------------------
export const TOKEN_KEY = 'vulnscope_token';

export const setAuthToken = (token: string | null): void => {
  if (typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};

export const getAuthToken = (): string | null => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY) ?? null;
  }
  return null;
};

// -----------------------------------------------------------------------------
// 3. JSON parse helper – throws a helpful error if body cannot be parsed
// -----------------------------------------------------------------------------
const parseJson = async <T>(r: Response): Promise<T> => {
  const text = await r.text();
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`Failed to parse response JSON: ${text}`);
  }
};

// -----------------------------------------------------------------------------
// 4. Centraled fetch wrapper
// -----------------------------------------------------------------------------
export interface FetchOptions extends RequestInit {
  /** If true (default), automatically attach the auth header. */
  requireAuth?: boolean;
}

export async function apiFetch<T = any>(
  endpoint: string,
  opts: FetchOptions = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const { requireAuth = true, ...config } = opts;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge any caller‑supplied headers
  if (config.headers) {
    const supplied = config.headers as Record<string, string>;
    Object.assign(headers, supplied);
  }

  if (requireAuth) {
    const token = getAuthToken();
    if (!token) throw new Error('Missing auth token – please login again');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...config, headers });

  if (!response.ok) {
    const errBody = await parseJson<{ error?: string; message?: string }>(response)
      .catch(() => ({ error: 'Unknown error' }))
      .catch(() => ({ error: 'Unknown error' })) as { error?: string; message?: string };
    const msg = errBody?.message ?? errBody?.error ?? `HTTP ${response.status}`;
    throw new Error(msg);
  }

  if (response.status === 204) return undefined as any;
  return parseJson<T>(response);
}

// -----------------------------------------------------------------------------
// 5. Auth helpers – register, login, logout
// -----------------------------------------------------------------------------
export interface AuthResponse {
  user: { id: string; email: string; name: string };
  token: string;
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  setAuthToken(res.token);
  return res;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(res.token);
  return res;
}

export async function logout(): Promise<void> {
  await apiFetch<void>('/auth/logout', { method: 'POST' });
  setAuthToken(null);
}

// -----------------------------------------------------------------------------
// 6. Dashboard bootstrap (pull all data in one call)
// -----------------------------------------------------------------------------
export async function bootstrapDashboard(): Promise<any> {
  return apiFetch<any>('/dashboard/bootstrap');
}

// -----------------------------------------------------------------------------
// 7. Target CRUD helpers
// -----------------------------------------------------------------------------
export interface Target {
  id: string;
  user_id: string;
  url: string;
  name: string;
  created_at: string;
}

export async function addTarget(url: string, name: string): Promise<Target> {
  return apiFetch<Target>('/targets', {
    method: 'POST',
    body: JSON.stringify({ url, name }),
  });
}

export async function updateTarget(id: string, url: string, name: string): Promise<Target> {
  return apiFetch<Target>(`/targets/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ url, name }),
  });
}

export async function deleteTarget(id: string): Promise<void> {
  await apiFetch<void>(`/targets/${id}`, { method: 'DELETE' });
}

// -----------------------------------------------------------------------------
// 8. Scans helpers – start scan, poll progress
// -----------------------------------------------------------------------------
export interface Scan {
  id: string;
  targetUrl: string;
  status: string;
  progress: number;
  message: string;
  scanMode: string;
  createdAt: string;
  findingsCount: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export async function startScan(targetUrl: string): Promise<Scan> {
  return apiFetch<Scan>('/scans', {
    method: 'POST',
    body: JSON.stringify({ targetUrl }),
  });
}

export interface ScanPipeline extends Scan {
  stages: { name: string; status: string }[];
}

export async function pollScanPipeline(id: string): Promise<ScanPipeline> {
  return apiFetch<ScanPipeline>(`/scans/${id}/pipeline`);
}

// -----------------------------------------------------------------------------
// 9. Report helpers – download PDF
// -----------------------------------------------------------------------------
export async function downloadPDF(scanId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('You must be logged in to download reports');

  const res = await fetch(`${API_BASE}/reports/${scanId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res).catch(() => ({ error: 'Download failed' })) as { error?: string };
    throw new Error(err.error ?? 'Download failed');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vulnscope_${scanId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// 10. Findings – accept / reject fix
// -----------------------------------------------------------------------------
export async function acceptFix(findingId: string, userName: string): Promise<void> {
  await apiFetch<void>(`/findings/${findingId}/accept-fix`, {
    method: 'POST',
    body: JSON.stringify({ userName }),
  });
}

export async function rejectFix(findingId: string, userName: string, reason?: string): Promise<void> {
  const body: any = { userName };
  if (reason) body.reason = reason;
  await apiFetch<void>(`/findings/${findingId}/reject-fix`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// -----------------------------------------------------------------------------
// 11. Settings helpers
// -----------------------------------------------------------------------------
export interface SettingsPayload {
  notifications: boolean;
  autoScan: boolean;
}

export async function saveSettings(payload: SettingsPayload): Promise<void> {
  await apiFetch<void>('/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// -----------------------------------------------------------------------------
// 12. Export all helpers for use in components
// -----------------------------------------------------------------------------
export default {
  register,
  login,
  logout,
  bootstrapDashboard,
  addTarget,
  updateTarget,
  deleteTarget,
  startScan,
  pollScanPipeline,
  downloadPDF,
  acceptFix,
  rejectFix,
  saveSettings,
  setAuthToken,
  getAuthToken,
  apiFetch,
};
