import type { StoryPriority } from "../models/Story";
import type { Task } from "../models/Task";

const STORAGE_KEY = "manageme_tasks";

export class TaskService {
  private getAll(): Task[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveAll(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  getTasksByProject(projectId: string): Task[] {
    return this.getAll().filter((task) => task.projectId === projectId);
  }

  getTasksByStory(storyId: string): Task[] {
    return this.getAll().filter((task) => task.storyId === storyId);
  }

  getTaskById(id: string): Task | undefined {
    return this.getAll().find((task) => task.id === id);
  }

  createTask(input: {
    name: string;
    description: string;
    priority: StoryPriority;
    storyId: string;
    projectId: string;
    estimatedHours: number;
  }): Task {
    const task: Task = {
      id: this.generateId(),
      name: input.name,
      description: input.description,
      priority: input.priority,
      storyId: input.storyId,
      projectId: input.projectId,
      estimatedHours: input.estimatedHours,
      workedHours: 0,
      status: "todo",
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      assigneeId: null,
    };

    const tasks = this.getAll();
    tasks.push(task);
    this.saveAll(tasks);
    return task;
  }

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
  ): Task | null {
    const tasks = this.getAll();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) {
      return null;
    }

    tasks[index] = {
      ...tasks[index],
      name: updates.name,
      description: updates.description,
      priority: updates.priority,
      storyId: updates.storyId,
      projectId: updates.projectId,
      estimatedHours: updates.estimatedHours,
      workedHours: updates.workedHours,
    };

    this.saveAll(tasks);
    return tasks[index];
  }

  assignTask(id: string, assigneeId: string): Task | null {
    const tasks = this.getAll();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) {
      return null;
    }

    const task = tasks[index];
    tasks[index] = {
      ...task,
      assigneeId,
      status: task.status === "todo" ? "doing" : task.status,
      startedAt: task.startedAt ?? new Date().toISOString(),
      finishedAt: task.status === "done" ? task.finishedAt : null,
    };

    this.saveAll(tasks);
    return tasks[index];
  }

  markTaskDone(id: string, workedHours: number): Task | null {
    const tasks = this.getAll();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) {
      return null;
    }

    const task = tasks[index];
    if (!task.assigneeId) {
      return null;
    }

    tasks[index] = {
      ...task,
      status: "done",
      workedHours,
      startedAt: task.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };

    this.saveAll(tasks);
    return tasks[index];
  }

  deleteTask(id: string): boolean {
    const tasks = this.getAll();
    const filtered = tasks.filter((task) => task.id !== id);
    if (filtered.length === tasks.length) {
      return false;
    }

    this.saveAll(filtered);
    return true;
  }

  deleteTasksByProject(projectId: string): void {
    this.saveAll(this.getAll().filter((task) => task.projectId !== projectId));
  }

  deleteTasksByStory(storyId: string): void {
    this.saveAll(this.getAll().filter((task) => task.storyId !== storyId));
  }
}
