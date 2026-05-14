export const SESSION_STORAGE_KEYS = {
  loggedUserId: "manageme_logged_user_id",
  activeProjectId: "manageme_active_project_id",
} as const;

class SessionStorageService {
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}

export const sessionStorageService = new SessionStorageService();
