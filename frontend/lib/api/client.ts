// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('vulnscope_token', token);
  } else {
    localStorage.removeItem('vulnscope_token');
  }
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('vulnscope_token');
  }
  return authToken;
};

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiFetch<T = any>(
  endpoint: string,
  { requireAuth = true, ...options }: FetchOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Build headers as a plain object first
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Copy any existing headers from options
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  if (requireAuth) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}