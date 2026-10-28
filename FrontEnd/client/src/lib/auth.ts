export type AuthUser = {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt?: string;
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export function getAuthToken() {
  return null;
}

export function saveAuth(_token: string, _user: AuthUser) {
  return;
}

export function getAuthUser() {
  return null;
}

export function clearAuth() {
  return;
}

export function isAuthenticated() {
  return false;
}

export function isAdminUser(user?: AuthUser | null) {
  return user?.role === "admin";
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await apiJson<{ user: AuthUser }>('/users/me');
    return payload?.user ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  return response;
}

export async function apiJson<T>(path: string, init: RequestInit = {}) {
  const response = await apiRequest(path, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || payload?.error || "Request failed";
    throw new Error(message);
  }

  return payload as T;
}
