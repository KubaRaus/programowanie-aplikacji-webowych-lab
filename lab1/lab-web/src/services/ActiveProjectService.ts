import {
  SESSION_STORAGE_KEYS,
  sessionStorageService,
} from "./storage/SessionStorage";
import type { IActiveProjectStore } from "../ports/Repositories";

export class ActiveProjectService implements IActiveProjectStore {
  getActiveProjectId(): string | null {
    return sessionStorageService.get(SESSION_STORAGE_KEYS.activeProjectId);
  }

  setActiveProjectId(projectId: string): void {
    sessionStorageService.set(SESSION_STORAGE_KEYS.activeProjectId, projectId);
  }

  clearActiveProjectId(): void {
    sessionStorageService.remove(SESSION_STORAGE_KEYS.activeProjectId);
  }
}
