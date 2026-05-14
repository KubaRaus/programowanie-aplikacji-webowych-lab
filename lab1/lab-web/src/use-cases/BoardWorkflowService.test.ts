import { describe, expect, it, vi } from "vitest";
import type { Story } from "../models/Story";
import type { Task } from "../models/Task";
import { BoardWorkflowService } from "./BoardWorkflowService";
import type {
  IActiveProjectStore,
  IProjectRepository,
  IStoryRepository,
  ITaskRepository,
} from "../ports/Repositories";

describe("BoardWorkflowService", () => {
  it("creates project and activates it when none selected", () => {
    const projectRepo: IProjectRepository = {
      getProjects: vi.fn(() => []),
      getProjectById: vi.fn(),
      createProject: vi.fn(() => ({ id: "p1", name: "P", description: "D" })),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
    };
    const storyRepo: IStoryRepository = {
      getStoriesByProject: vi.fn(),
      getStoryById: vi.fn(),
      createStory: vi.fn(),
      updateStory: vi.fn(),
      deleteStory: vi.fn(),
      updateStoryStatus: vi.fn(),
      deleteStoriesByProject: vi.fn(),
    };
    const taskRepo: ITaskRepository = {
      getTasksByProject: vi.fn(),
      getTasksByStory: vi.fn(),
      getTaskById: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      assignTask: vi.fn(),
      markTaskDone: vi.fn(),
      deleteTask: vi.fn(),
      deleteTasksByProject: vi.fn(),
      deleteTasksByStory: vi.fn(),
    };
    const activeProjectStore: IActiveProjectStore = {
      getActiveProjectId: vi.fn(() => null),
      setActiveProjectId: vi.fn(),
      clearActiveProjectId: vi.fn(),
    };

    const workflow = new BoardWorkflowService(
      projectRepo,
      storyRepo,
      taskRepo,
      activeProjectStore,
    );

    const result = workflow.upsertProject({
      editingProjectId: null,
      name: "P",
      description: "D",
      adminRecipientIds: ["admin-1"],
    });

    expect(result.ok).toBe(true);
    expect(result.notifications).toHaveLength(1);
    expect(activeProjectStore.setActiveProjectId).toHaveBeenCalledWith("p1");
  });

  it("creates task and sends story-owner notification", () => {
    const projectRepo: IProjectRepository = {
      getProjects: vi.fn(),
      getProjectById: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
    };
    const storyRepo: IStoryRepository = {
      getStoriesByProject: vi.fn(),
      getStoryById: vi.fn((): Story => ({
        id: "s1",
        name: "Story 1",
        description: "",
        priority: "sredni",
        projectId: "p1",
        createdAt: "",
        status: "todo",
        ownerId: "owner-1",
      })),
      createStory: vi.fn(),
      updateStory: vi.fn(),
      deleteStory: vi.fn(),
      updateStoryStatus: vi.fn(),
      deleteStoriesByProject: vi.fn(),
    };
    const taskRepo: ITaskRepository = {
      getTasksByProject: vi.fn(),
      getTasksByStory: vi.fn(),
      getTaskById: vi.fn(),
      createTask: vi.fn((): Task => ({
        id: "t1",
        name: "Task",
        description: "",
        priority: "sredni",
        storyId: "s1",
        projectId: "p1",
        estimatedHours: 2,
        workedHours: 0,
        status: "todo",
        createdAt: "",
        startedAt: null,
        finishedAt: null,
        assigneeId: null,
      })),
      updateTask: vi.fn(),
      assignTask: vi.fn(),
      markTaskDone: vi.fn(),
      deleteTask: vi.fn(),
      deleteTasksByProject: vi.fn(),
      deleteTasksByStory: vi.fn(),
    };
    const activeProjectStore: IActiveProjectStore = {
      getActiveProjectId: vi.fn(),
      setActiveProjectId: vi.fn(),
      clearActiveProjectId: vi.fn(),
    };

    const workflow = new BoardWorkflowService(
      projectRepo,
      storyRepo,
      taskRepo,
      activeProjectStore,
    );

    const result = workflow.upsertTask({
      editingTaskId: null,
      name: "Task",
      description: "",
      priority: "sredni",
      storyId: "s1",
      projectId: "p1",
      estimatedHours: 2,
    });

    expect(result.ok).toBe(true);
    expect(result.selectedTaskId).toBe("t1");
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].recipientIds).toEqual(["owner-1"]);
  });
});
