export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://mako-golden-tetra.ngrok-free.app/api";

export type LoginResponse = { access: string; refresh: string };

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasBody = typeof init.body !== "undefined" && init.body !== null;
  const method = (init.method || "GET").toUpperCase();

  // Start from caller-provided headers if any
  const mergedHeaders: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };

  // Only set Content-Type when there is a body, and do not override FormData
  const isForm = typeof FormData !== "undefined" && hasBody && init.body instanceof FormData;
  const hasContentType = Object.keys(mergedHeaders || {}).some((k) => k.toLowerCase() === "content-type");
  if (hasBody && !isForm && !hasContentType && method !== "GET" && method !== "HEAD") {
    mergedHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: Object.keys(mergedHeaders).length ? mergedHeaders : undefined,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.detail) msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
      // Auto-logout on invalid/expired token
      if (res.status === 401 && (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('not valid'))) {
        setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refresh');
          window.location.href = '/login';
        }
      }
    } catch {
      // ignore parse
    }
    throw new Error(msg);
  }
  return res.json();
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  // Start from caller-provided headers if any
  const mergedHeaders: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  if (token && token.trim().length > 0) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }
  return apiFetch<T>(path, {
    ...init,
    headers: Object.keys(mergedHeaders).length ? mergedHeaders : undefined,
  });
}

export async function logout(): Promise<void> {
  try {
    await authFetch(`/accounts/logout`, { method: "POST" });
  } catch {
    // ignore
  } finally {
    setToken(null);
    if (typeof window !== "undefined") localStorage.removeItem("refresh");
  }
}

export function isAuthed(): boolean {
  return !!getToken();
}

