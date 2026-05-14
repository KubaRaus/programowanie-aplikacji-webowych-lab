import type { IActiveProjectStore } from "../ports/Repositories";
import { AppStateService } from "./AppStateService";

const ACTIVE_PROJECT_KEY = "active_project_id";

export class ActiveProjectService implements IActiveProjectStore {
  private readonly appStateService = new AppStateService();

  getActiveProjectId(): string | null {
    return this.appStateService.getValue(ACTIVE_PROJECT_KEY);
  }

  setActiveProjectId(projectId: string): void {
    this.appStateService.setValue(ACTIVE_PROJECT_KEY, projectId);
  }

  clearActiveProjectId(): void {
    this.appStateService.removeValue(ACTIVE_PROJECT_KEY);
  }
}
