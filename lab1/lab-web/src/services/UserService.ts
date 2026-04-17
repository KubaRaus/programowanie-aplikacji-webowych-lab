import type { User } from "../models/User";

const USERS_STORAGE_KEY = "manageme_users";
const LOGGED_USER_ID_STORAGE_KEY = "manageme_logged_user_id";

type OAuthProfile = {
  email: string;
  firstName: string;
  lastName: string;
};

export class UserService {
  private getAll(): User[] {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  }

  private saveAll(users: User[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  private toCanonicalEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private saveLoggedInUserId(userId: string): void {
    localStorage.setItem(LOGGED_USER_ID_STORAGE_KEY, userId);
  }

  getLoggedInUser(): User | null {
    const loggedInUserId = localStorage.getItem(LOGGED_USER_ID_STORAGE_KEY);
    if (!loggedInUserId) {
      return null;
    }

    return this.getUserById(loggedInUserId) ?? null;
  }

  logout(): void {
    localStorage.removeItem(LOGGED_USER_ID_STORAGE_KEY);
  }

  getUsers(): User[] {
    return this.getAll();
  }

  getUserById(id: string): User | undefined {
    return this.getAll().find((user) => user.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    const canonicalEmail = this.toCanonicalEmail(email);
    return this.getAll().find(
      (user) => this.toCanonicalEmail(user.email) === canonicalEmail,
    );
  }

  getAdminUsers(): User[] {
    return this.getUsers().filter((user) => user.role === "admin");
  }

  getAssignableUsers(): User[] {
    return this.getUsers().filter(
      (user) =>
        !user.isBlocked &&
        (user.role === "developer" || user.role === "devops"),
    );
  }

  loginWithOAuthProfile(
    profile: OAuthProfile,
    superAdminEmail: string,
  ): { user: User; isNewUser: boolean } {
    const users = this.getAll();
    const canonicalProfileEmail = this.toCanonicalEmail(profile.email);
    const canonicalSuperAdminEmail = this.toCanonicalEmail(superAdminEmail);
    const existingIndex = users.findIndex(
      (user) => this.toCanonicalEmail(user.email) === canonicalProfileEmail,
    );

    if (existingIndex >= 0) {
      const existing = users[existingIndex];
      const role =
        canonicalProfileEmail === canonicalSuperAdminEmail
          ? "admin"
          : existing.role;
      const updated: User = {
        ...existing,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role,
      };
      users[existingIndex] = updated;
      this.saveAll(users);
      this.saveLoggedInUserId(updated.id);
      return { user: updated, isNewUser: false };
    }

    const created: User = {
      id: this.generateId(),
      email: canonicalProfileEmail,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role:
        canonicalProfileEmail === canonicalSuperAdminEmail ? "admin" : "guest",
      isBlocked: false,
    };
    users.push(created);
    this.saveAll(users);
    this.saveLoggedInUserId(created.id);
    return { user: created, isNewUser: true };
  }

  updateUserRole(userId: string, role: User["role"]): User | null {
    const users = this.getAll();
    const index = users.findIndex((user) => user.id === userId);
    if (index < 0) {
      return null;
    }

    users[index] = { ...users[index], role };
    this.saveAll(users);
    return users[index];
  }

  setUserBlocked(userId: string, isBlocked: boolean): User | null {
    const users = this.getAll();
    const index = users.findIndex((user) => user.id === userId);
    if (index < 0) {
      return null;
    }

    users[index] = { ...users[index], isBlocked };
    this.saveAll(users);
    return users[index];
  }
}
