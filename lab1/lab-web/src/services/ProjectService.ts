import type { Project } from '../models/Project';

const STORAGE_KEY = 'manageme_projects';

export class ProjectService {
  private getAll(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveAll(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  getProjects(): Project[] {
    return this.getAll();
  }

  getProjectById(id: string): Project | undefined {
    return this.getAll().find((p) => p.id === id);
  }

  createProject(name: string, description: string): Project {
    const project: Project = {
      id: this.generateId(),
      name,
      description,
    };
    const projects = this.getAll();
    projects.push(project);
    this.saveAll(projects);
    return project;
  }

  updateProject(id: string, name: string, description: string): Project | null {
    const projects = this.getAll();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return null;

    projects[index] = { id, name, description };
    this.saveAll(projects);
    return projects[index];
  }

  deleteProject(id: string): boolean {
    const projects = this.getAll();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) return false;
    this.saveAll(filtered);
    return true;
  }
}
