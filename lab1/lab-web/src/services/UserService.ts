import type { User } from "../models/User";
import type { IUserRepository } from "../ports/Repositories";
import { appStorage } from "./storage/AppStorage";
import {
  SESSION_STORAGE_KEYS,
  sessionStorageService,
} from "./storage/SessionStorage";

const USERS_STORAGE_KEY = "manageme_users";

type OAuthProfile = {
  email: string;
  firstName: string;
  lastName: string;
};

export class UserService implements IUserRepository {
  private getAll(): User[] {
    return appStorage.getCollection<User>(USERS_STORAGE_KEY);
  }

  private saveAll(users: User[]): void {
    appStorage.setCollection(USERS_STORAGE_KEY, users);
  }

  private toCanonicalEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private saveLoggedInUserId(userId: string): void {
    sessionStorageService.set(SESSION_STORAGE_KEYS.loggedUserId, userId);
  }

  getLoggedInUser(): User | null {
    const loggedInUserId = sessionStorageService.get(
      SESSION_STORAGE_KEYS.loggedUserId,
    );
    if (!loggedInUserId) {
      return null;
    }

    return this.getUserById(loggedInUserId) ?? null;
  }

  logout(): void {
    sessionStorageService.remove(SESSION_STORAGE_KEYS.loggedUserId);
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
