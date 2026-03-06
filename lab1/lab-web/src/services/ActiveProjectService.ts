const STORAGE_KEY = "manageme_active_project_id";

export class ActiveProjectService {
  getActiveProjectId(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  setActiveProjectId(projectId: string): void {
    localStorage.setItem(STORAGE_KEY, projectId);
  }

  clearActiveProjectId(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
