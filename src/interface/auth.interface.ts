export interface AuthUser {
  id: string;
  username: string;
  name: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterInput extends LoginCredentials {
  name?: string;
}
