export type UserRole = "admin" | "devops" | "developer" | "guest";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isBlocked: boolean;
}
