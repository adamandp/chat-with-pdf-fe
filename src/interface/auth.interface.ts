export interface AuthUser {
  id: string;
  username: string | null;
  name: string | null;
  accountType: "GUEST" | "REGISTERED";
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterInput extends LoginCredentials {
  name?: string;
}
