import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 15_000,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 15_000,
  withCredentials: true,
});

export async function refreshAccessToken(): Promise<string | null> {
  refreshing ??= refreshClient
    .post<{ data?: { accessToken?: string } }>("/session/refresh")
    .then(({ data }) => {
      const token = data.data?.accessToken ?? null;
      setAccessToken(token);
      return token;
    })
    .catch((error: unknown) => {
      setAccessToken(null);
      // Only a missing/expired session authorizes anonymous guest creation.
      if (axios.isAxiosError(error) && error.response?.status === 401) return null;
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

axiosInstance.interceptors.request.use((config) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

axiosInstance.interceptors.response.use(undefined, async (error: AxiosError) => {
  const request = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  if (
    error.response?.status !== 401 ||
    !request ||
    request._retried ||
    /\/(auth\/(guest|login|register|logout)|session\/refresh)/.test(request.url ?? "")
  ) {
    throw error;
  }
  request._retried = true;
  const token = await refreshAccessToken();
  if (!token) throw error;
  request.headers.set("Authorization", `Bearer ${token}`);
  return axiosInstance(request);
});

/** Fetch stream requests independently of Axios' JSON response handling. */
export async function authenticatedFetch(path: string, init: RequestInit): Promise<Response> {
  const url = `${axiosInstance.defaults.baseURL?.replace(/\/$/, "")}${path}`;
  const request = async (token: string | null) =>
    fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  let response = await request(accessToken);
  if (response.status === 401) {
    const token = await refreshAccessToken();
    if (token) response = await request(token);
  }
  return response;
}
