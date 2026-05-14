import type {
  IStoryRepository,
  ITaskRepository,
  IUserRepository,
} from "../ports/Repositories";
import type { NotificationDraft, WorkflowResult } from "./WorkflowTypes";

export class TaskWorkflowService {
  private readonly taskService: ITaskRepository;
  private readonly storyService: IStoryRepository;
  private readonly userService: IUserRepository;

  constructor(
    taskService: ITaskRepository,
    storyService: IStoryRepository,
    userService: IUserRepository,
  ) {
    this.taskService = taskService;
    this.storyService = storyService;
    this.userService = userService;
  }

  deleteTask(taskId: string): WorkflowResult {
    const task = this.taskService.getTaskById(taskId);
    if (!task) {
      return { ok: false, error: "Nie znaleziono zadania.", notifications: [] };
    }

    const isDeleted = this.taskService.deleteTask(taskId);
    if (!isDeleted) {
      return { ok: false, error: "Nie udalo sie usunac zadania.", notifications: [] };
    }

    const notifications: NotificationDraft[] = [];
    const story = this.storyService.getStoryById(task.storyId);
    if (story) {
      notifications.push({
        title: "Usunieto zadanie z historyjki",
        message: `Zadanie "${task.name}" zostalo usuniete z historyjki "${story.name}".`,
        priority: "medium",
        recipientIds: [story.ownerId],
      });
    }

    const storyTasks = this.taskService.getTasksByStory(task.storyId);
    if (storyTasks.length > 0 && storyTasks.every((item) => item.status === "done")) {
      this.storyService.updateStoryStatus(task.storyId, "done");
    }

    return { ok: true, notifications };
  }

  assignTask(taskId: string, assigneeId: string): WorkflowResult {
    const assignee = this.userService.getUserById(assigneeId);
    if (!assignee || (assignee.role !== "developer" && assignee.role !== "devops")) {
      return {
        ok: false,
        error: "Zadanie moze byc przypisane tylko do developer lub devops.",
        notifications: [],
      };
    }

    const previousTask = this.taskService.getTaskById(taskId);
    if (!previousTask) {
      return { ok: false, error: "Nie znaleziono zadania.", notifications: [] };
    }

    const updatedTask = this.taskService.assignTask(taskId, assigneeId);
    if (!updatedTask) {
      return { ok: false, error: "Nie udalo sie przypisac zadania.", notifications: [] };
    }

    const notifications: NotificationDraft[] = [
      {
        title: "Przypisano Cie do zadania",
        message: `Zadanie "${updatedTask.name}" zostalo przypisane do ${assignee.firstName} ${assignee.lastName}.`,
        priority: "high",
        recipientIds: [assigneeId],
      },
    ];

    const story = this.storyService.getStoryById(updatedTask.storyId);
    if (story && story.status === "todo") {
      this.storyService.updateStoryStatus(story.id, "doing");
    }

    if (
      story &&
      previousTask.status !== updatedTask.status &&
      updatedTask.status === "doing"
    ) {
      notifications.push({
        title: "Zmiana statusu zadania",
        message: `Zadanie "${updatedTask.name}" zmienilo status na doing.`,
        priority: "low",
        recipientIds: [story.ownerId],
      });
    }

    return { ok: true, notifications };
  }

  finishTask(taskId: string, workedHours: number): WorkflowResult {
    const task = this.taskService.getTaskById(taskId);
    if (!task) {
      return { ok: false, error: "Nie znaleziono zadania.", notifications: [] };
    }

    if (!task.assigneeId) {
      return {
        ok: false,
        error: "Najpierw przypisz osobe do zadania.",
        notifications: [],
      };
    }

    const updatedTask = this.taskService.markTaskDone(task.id, workedHours);
    if (!updatedTask) {
      return { ok: false, error: "Nie udalo sie zamknac zadania.", notifications: [] };
    }

    const notifications: NotificationDraft[] = [];
    const story = this.storyService.getStoryById(updatedTask.storyId);
    if (story) {
      notifications.push({
        title: "Zmiana statusu zadania",
        message: `Zadanie "${updatedTask.name}" zmienilo status na done.`,
        priority: "medium",
        recipientIds: [story.ownerId],
      });
    }

    const storyTasks = this.taskService.getTasksByStory(task.storyId);
    if (storyTasks.length > 0 && storyTasks.every((item) => item.status === "done")) {
      this.storyService.updateStoryStatus(task.storyId, "done");
    }

    return { ok: true, notifications };
  }
}
