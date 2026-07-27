const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_VITE_API_URL ??
  "http://localhost:4000/api";

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

type Envelope<T> = {
  success: boolean;
  data: T;
  error?: { code: string; message: string | string[] };
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message);
  }
}

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });
  if (response.status === 401 && retry && path !== "/auth/refresh") {
    if (await refreshAccessToken()) return api<T>(path, options, false);
  }
  const body = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok) {
    const message = body?.error?.message;
    throw new ApiError(
      Array.isArray(message) ? message.join(", ") : message ?? "Request failed",
      response.status,
      body?.error
    );
  }
  return body!.data;
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const body = (await response.json()) as Envelope<{ accessToken: string }>;
        accessToken = body.data.accessToken;
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}
