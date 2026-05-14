import type { Story, StoryPriority, StoryStatus } from "../models/Story";
import type { Task } from "../models/Task";
import type { User } from "../models/User";
import type { Project } from "../models/Project";

export interface IProjectRepository {
  getProjects(): Project[];
  getProjectById(id: string): Project | undefined;
  createProject(name: string, description: string): Project;
  updateProject(id: string, name: string, description: string): Project | null;
  deleteProject(id: string): boolean;
}

export interface IStoryRepository {
  getStoriesByProject(projectId: string): Story[];
  getStoryById(id: string): Story | undefined;
  createStory(input: {
    name: string;
    description: string;
    priority: StoryPriority;
    projectId: string;
    status: StoryStatus;
    ownerId: string;
  }): Story;
  updateStory(
    id: string,
    updates: {
      name: string;
      description: string;
      priority: StoryPriority;
      status: StoryStatus;
      ownerId: string;
    },
  ): Story | null;
  deleteStory(id: string): boolean;
  updateStoryStatus(id: string, status: StoryStatus): Story | null;
  deleteStoriesByProject(projectId: string): void;
}

export interface ITaskRepository {
  getTasksByProject(projectId: string): Task[];
  getTasksByStory(storyId: string): Task[];
  getTaskById(id: string): Task | undefined;
  createTask(input: {
    name: string;
    description: string;
    priority: StoryPriority;
    storyId: string;
    projectId: string;
    estimatedHours: number;
  }): Task;
  updateTask(
    id: string,
    updates: {
      name: string;
      description: string;
      priority: StoryPriority;
      storyId: string;
      projectId: string;
      estimatedHours: number;
      workedHours: number;
    },
  ): Task | null;
  assignTask(id: string, assigneeId: string): Task | null;
  markTaskDone(id: string, workedHours: number): Task | null;
  deleteTask(id: string): boolean;
  deleteTasksByProject(projectId: string): void;
  deleteTasksByStory(storyId: string): void;
}

export interface IUserRepository {
  getUserById(id: string): User | undefined;
}

export interface IActiveProjectStore {
  getActiveProjectId(): string | null;
  setActiveProjectId(projectId: string): void;
  clearActiveProjectId(): void;
}
