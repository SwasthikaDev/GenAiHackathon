export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://mako-golden-tetra.ngrok-free.app/api";

export type LoginResponse = { access: string; refresh: string };

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
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
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
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

