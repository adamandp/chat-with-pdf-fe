import { axiosInstance, refreshAccessToken, setAccessToken } from "@/lib/axios";
import type { AuthUser, LoginCredentials, RegisterInput } from "@/interface/auth.interface";
import type { WebResponse } from "@/interface/common.interface";

export async function getProfile(): Promise<AuthUser> {
  const { data } = await axiosInstance.get<WebResponse<AuthUser>>("/auth/profile");
  return data.data;
}

export async function login(input: LoginCredentials): Promise<AuthUser> {
  const { data } = await axiosInstance.post<WebResponse<{ accessToken: string }>>(
    "/auth/login",
    input,
  );
  setAccessToken(data.data.accessToken);
  return getProfile();
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  await axiosInstance.post("/auth/register", input);
  return login({ username: input.username, password: input.password });
}

export async function bootstrapAuth(): Promise<AuthUser | null> {
  if (!(await refreshAccessToken())) return null;
  try {
    return await getProfile();
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function logout(all = false): Promise<void> {
  try {
    await axiosInstance.post(all ? "/auth/logout-all" : "/auth/logout");
  } finally {
    setAccessToken(null);
  }
}
