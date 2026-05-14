import { describe, expect, it, vi } from "vitest";
import type { Story } from "../models/Story";
import type { Task } from "../models/Task";
import type { User } from "../models/User";
import { TaskWorkflowService } from "./TaskWorkflowService";
import type {
  IStoryRepository,
  ITaskRepository,
  IUserRepository,
} from "../ports/Repositories";

describe("TaskWorkflowService", () => {
  it("rejects assignment for non-dev roles", () => {
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
    const storyRepo: IStoryRepository = {
      getStoriesByProject: vi.fn(),
      getStoryById: vi.fn(),
      createStory: vi.fn(),
      updateStory: vi.fn(),
      deleteStory: vi.fn(),
      updateStoryStatus: vi.fn(),
      deleteStoriesByProject: vi.fn(),
    };
    const userRepo: IUserRepository = {
      getUserById: vi.fn((): User => ({
        id: "u1",
        email: "guest@example.com",
        firstName: "Guest",
        lastName: "User",
        role: "guest",
        isBlocked: false,
      })),
    };

    const workflow = new TaskWorkflowService(taskRepo, storyRepo, userRepo);
    const result = workflow.assignTask("t1", "u1");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("developer lub devops");
  });

  it("marks task as done and emits notification", () => {
    const baseTask: Task = {
      id: "t1",
      name: "Task",
      description: "",
      priority: "sredni",
      storyId: "s1",
      projectId: "p1",
      estimatedHours: 2,
      workedHours: 1,
      status: "doing",
      createdAt: "",
      startedAt: "",
      finishedAt: null,
      assigneeId: "u1",
    };

    const taskRepo: ITaskRepository = {
      getTasksByProject: vi.fn(),
      getTasksByStory: vi.fn(() => [{ ...baseTask, status: "done" as const }]),
      getTaskById: vi.fn(() => baseTask),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      assignTask: vi.fn(),
      markTaskDone: vi.fn(
        () =>
          ({
            ...baseTask,
            workedHours: 5,
            status: "done",
            finishedAt: "",
          }) as Task,
      ),
      deleteTask: vi.fn(),
      deleteTasksByProject: vi.fn(),
      deleteTasksByStory: vi.fn(),
    };
    const baseStory: Story = {
      id: "s1",
      name: "Story",
      description: "",
      priority: "sredni",
      projectId: "p1",
      createdAt: "",
      status: "doing",
      ownerId: "u2",
    };
    const storyRepo: IStoryRepository = {
      getStoriesByProject: vi.fn(),
      getStoryById: vi.fn(() => baseStory),
      createStory: vi.fn(),
      updateStory: vi.fn(),
      deleteStory: vi.fn(),
      updateStoryStatus: vi.fn(),
      deleteStoriesByProject: vi.fn(),
    };
    const userRepo: IUserRepository = { getUserById: vi.fn() };

    const workflow = new TaskWorkflowService(taskRepo, storyRepo, userRepo);
    const result = workflow.finishTask("t1", 5);

    expect(result.ok).toBe(true);
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].priority).toBe("medium");
    expect(storyRepo.updateStoryStatus).toHaveBeenCalledWith("s1", "done");
  });
});
