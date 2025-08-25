/**
 * Minimal REST API client for the notes frontend.
 * All endpoints are placeholders to be wired to the notes_database backend.
 * Uses fetch and returns typed results. No base URL is hardcoded.
 *
 * Environment configuration:
 * - Request orchestrator to set VITE_API_BASE_URL in .env (exposed to client) for base API path.
 */

// PUBLIC_INTERFACE
export interface ApiNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  archived?: boolean;
}

// PUBLIC_INTERFACE
export interface ApiAuthResponse {
  token: string;
  user: { id: string; email: string; name?: string };
}

// PUBLIC_INTERFACE
export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

const getBaseUrl = (): string => {
  // Use VITE_API_BASE_URL from env, fallback to '/api' as a conventional dev path.
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  return base.replace(/\/+$/, "");
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err: ApiError = {
      message: txt || res.statusText || "Request failed",
      status: res.status,
    };
    throw err;
  }
  if (res.status === 204) {
    // No content
    return undefined as unknown as T;
  }
  return (await res.json()) as T;
}

// PUBLIC_INTERFACE
export const Api = {
  // Auth
  async login(email: string, password: string): Promise<ApiAuthResponse> {
    return http<ApiAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(email: string, password: string, name?: string): Promise<ApiAuthResponse> {
    return http<ApiAuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  },

  async me(token: string): Promise<ApiAuthResponse["user"]> {
    return http<ApiAuthResponse["user"]>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Notes
  async listNotes(params: { q?: string; tag?: string; archived?: boolean } = {}, token?: string): Promise<ApiNote[]> {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.tag) search.set("tag", params.tag);
    if (typeof params.archived === "boolean") search.set("archived", String(params.archived));
    const query = search.toString() ? `?${search.toString()}` : "";
    return http<ApiNote[]>(`/notes${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },

  async getNote(id: string, token?: string): Promise<ApiNote> {
    return http<ApiNote>(`/notes/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },

  async createNote(payload: { title: string; content: string; tags?: string[] }, token?: string): Promise<ApiNote> {
    return http<ApiNote>("/notes", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },

  async updateNote(id: string, payload: Partial<Omit<ApiNote, "id" | "createdAt" | "updatedAt">>, token?: string): Promise<ApiNote> {
    return http<ApiNote>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },

  async deleteNote(id: string, token?: string): Promise<void> {
    return http<void>(`/notes/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },
};

// PUBLIC_INTERFACE
export function saveToken(token: string) {
  localStorage.setItem("auth_token", token);
}

// PUBLIC_INTERFACE
export function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

// PUBLIC_INTERFACE
export function clearToken() {
  localStorage.removeItem("auth_token");
}
