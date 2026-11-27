export type Role = "customer" | "owner" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}