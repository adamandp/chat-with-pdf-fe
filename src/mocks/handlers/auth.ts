import { http, HttpResponse } from "msw";
import type { AuthUser } from "@/interface/auth.interface";
import { activateWorkspace, DEMO_USER_ID } from "../data/store";

type DemoUser = AuthUser & { passwordHash: string | null; passwordSalt?: string };
const usersKey = "chat-with-pdf:demo-users:v1";
const sessionKey = "chat-with-pdf:demo-login:v1";

function saved<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // This is a standalone demo; it can still work without browser persistence.
  }
}

const builtInUser: DemoUser = {
  id: DEMO_USER_ID,
  username: "demo",
  name: "Demo User",
  accountType: "REGISTERED",
  passwordHash: "",
};
let users = saved<DemoUser[]>(usersKey, [builtInUser]).map((user) => ({
  ...user,
  accountType: user.accountType || "REGISTERED",
}));
let activeUserId = saved<string | null>(sessionKey, null);
if (activeUserId) activateWorkspace(activeUserId);

async function hashPassword(password: string, salt: string) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bytes = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: Uint8Array.from(salt.match(/.{2}/g)!, (byte) => Number.parseInt(byte, 16)),
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    256,
  );
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function activeUser(): AuthUser | null {
  const profile = users.find((item) => item.id === activeUserId);
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    name: profile.name,
    accountType: profile.accountType,
  };
}

export const authHandlers = [
  http.post("*/api/auth/guest", () => {
    if (!activeUser()) {
      const guest: DemoUser = {
        id: crypto.randomUUID(),
        username: null,
        name: null,
        accountType: "GUEST",
        passwordHash: null,
      };
      users = [...users, guest];
      activeUserId = guest.id;
      save(usersKey, users);
      save(sessionKey, activeUserId);
      activateWorkspace(activeUserId);
    }
    return HttpResponse.json({
      message: "Guest session created",
      data: { accessToken: "mock-access-token" },
    });
  }),
  http.post("*/api/auth/register", async ({ request }) => {
    const payload = (await request.json()) as {
      username?: string;
      password?: string;
      name?: string;
    };
    const username = payload.username?.trim();
    if (
      !username ||
      !/^[a-zA-Z0-9_.-]{3,50}$/.test(username) ||
      !payload.password ||
      payload.password.length < 8 ||
      payload.password.length > 100
    )
      return HttpResponse.json({ message: "Invalid registration details" }, { status: 400 });
    if (users.some((item) => item.username === username))
      return HttpResponse.json({ message: "Username is already taken" }, { status: 409 });
    if (activeUser()?.accountType === "REGISTERED") {
      return HttpResponse.json({ message: "Already logged in" }, { status: 400 });
    }
    const passwordSalt = [...crypto.getRandomValues(new Uint8Array(16))]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const guest = users.find((item) => item.id === activeUserId && item.accountType === "GUEST");
    const registered: DemoUser = {
        id: guest?.id || crypto.randomUUID(),
        username,
        name: payload.name || null,
        accountType: "REGISTERED",
        passwordSalt,
        passwordHash: await hashPassword(payload.password, passwordSalt),
    };
    users = guest
      ? users.map((item) => (item.id === guest.id ? registered : item))
      : [...users, registered];
    if (guest) {
      activeUserId = null;
      save(sessionKey, null);
    }
    save(usersKey, users);
    return HttpResponse.json({ message: "Registered successfully" }, { status: 201 });
  }),
  http.post("*/api/auth/login", async ({ request }) => {
    const payload = (await request.json()) as { username?: string; password?: string };
    if (activeUser()?.accountType === "REGISTERED") {
      return HttpResponse.json({ message: "Already logged in" }, { status: 400 });
    }
    const user = users.find((item) => item.username === payload.username);
    const valid =
      user?.id === builtInUser.id
        ? payload.password === "demo12345"
        : Boolean(
            user?.passwordSalt &&
            payload.password &&
            (await hashPassword(payload.password, user.passwordSalt)) === user.passwordHash,
          );
    if (!user || !valid)
      return HttpResponse.json({ message: "Invalid username or password" }, { status: 401 });
    activeUserId = user.id;
    save(sessionKey, activeUserId);
    activateWorkspace(activeUserId);
    return HttpResponse.json({
      message: "Login successful",
      data: { accessToken: "mock-access-token" },
    });
  }),
  http.get("*/api/auth/profile", () => {
    const profile = activeUser();
    return profile
      ? HttpResponse.json({ message: "User profile", data: profile })
      : HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }),
  http.post("*/api/session/refresh", () => {
    return activeUser()
      ? HttpResponse.json({
          message: "Session refreshed",
          data: { accessToken: "mock-access-token" },
        })
      : HttpResponse.json({ message: "Session expired" }, { status: 401 });
  }),
  http.post("*/api/auth/logout", () => {
    activeUserId = null;
    save(sessionKey, null);
    activateWorkspace(null);
    return HttpResponse.json({ message: "Logged out" });
  }),
  http.post("*/api/auth/logout-all", () => {
    activeUserId = null;
    save(sessionKey, null);
    activateWorkspace(null);
    return HttpResponse.json({ message: "All sessions logged out" });
  }),
];
