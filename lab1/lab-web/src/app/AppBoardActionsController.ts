import type { Project } from "../models/Project";
import type { StoryPriority, StoryStatus } from "../models/Story";
import { BoardWorkflowService } from "../use-cases/BoardWorkflowService";
import { TaskWorkflowService } from "../use-cases/TaskWorkflowService";
import { TaskService } from "../services/TaskService";

type NotificationInput = {
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  recipientIds: string[];
};

type AppBoardActionsOptions = {
  boardWorkflowService: BoardWorkflowService;
  taskWorkflowService: TaskWorkflowService;
  taskService: TaskService;
  projectForm: HTMLFormElement;
  projectNameInput: HTMLInputElement;
  projectDescInput: HTMLTextAreaElement;
  storyForm: HTMLFormElement;
  storyNameInput: HTMLInputElement;
  storyDescInput: HTMLTextAreaElement;
  storyPriorityInput: HTMLSelectElement;
  storyStatusInput: HTMLSelectElement;
  storyOwnerInput: HTMLSelectElement;
  taskForm: HTMLFormElement;
  taskNameInput: HTMLInputElement;
  taskDescInput: HTMLTextAreaElement;
  taskPriorityInput: HTMLSelectElement;
  taskStoryInput: HTMLSelectElement;
  taskEstimatedHoursInput: HTMLInputElement;
  getActiveProject: () => Project | null;
  getAdminUserIds: () => string[];
  getRequiredLoggedInUserId: () => string;
  getEditingProjectId: () => string | null;
  getEditingStoryId: () => string | null;
  getEditingTaskId: () => string | null;
  getSelectedTaskId: () => string | null;
  setSelectedTaskId: (value: string | null) => void;
  sendNotification: (notification: NotificationInput) => Promise<boolean>;
  ensureStorageSynced: () => Promise<boolean>;
  renderProjects: () => void;
  renderStories: () => void;
  renderTaskStoryOptions: () => void;
  renderTasks: () => void;
  renderTaskDetails: () => void;
  cancelProjectEdit: () => void;
  cancelStoryEdit: () => void;
  cancelTaskEdit: () => void;
};

export function createAppBoardActionsController(options: AppBoardActionsOptions) {
  async function dispatchNotifications(
    notifications: NotificationInput[],
  ): Promise<boolean> {
    for (const notification of notifications) {
      if (!(await options.sendNotification(notification))) {
        return false;
      }
    }
    return true;
  }

  async function deleteProject(id: string): Promise<void> {
    if (!confirm("Czy na pewno chcesz usunac ten projekt?")) {
      return;
    }

    const result = options.boardWorkflowService.deleteProject(id);
    if (!result.ok) {
      alert(result.error ?? "Nie udalo sie usunac projektu.");
      return;
    }
    if (!(await dispatchNotifications(result.notifications))) {
      return;
    }
    if (!(await options.ensureStorageSynced())) {
      return;
    }

    if (options.getEditingProjectId() === id) {
      options.cancelProjectEdit();
    }

    if (result.clearedSelectedTask) {
      options.setSelectedTaskId(null);
    }
    options.cancelStoryEdit();
    options.cancelTaskEdit();
    options.renderProjects();
    options.renderStories();
    options.renderTaskStoryOptions();
    options.renderTasks();
    options.renderTaskDetails();
  }

  async function deleteStory(id: string): Promise<void> {
    if (!confirm("Czy na pewno chcesz usunac te historyjke?")) {
      return;
    }

    const result = options.boardWorkflowService.deleteStory(
      id,
      options.getSelectedTaskId(),
    );
    if (!result.ok) {
      alert(result.error ?? "Nie udalo sie usunac historyjki.");
      return;
    }
    if (!(await dispatchNotifications(result.notifications))) {
      return;
    }
    if (!(await options.ensureStorageSynced())) {
      return;
    }

    if (options.getEditingStoryId() === id) {
      options.cancelStoryEdit();
    }

    if (result.clearedSelectedTask) {
      options.setSelectedTaskId(null);
    }

    options.renderStories();
    options.renderTaskStoryOptions();
    options.renderTasks();
    options.renderTaskDetails();
  }

  async function deleteTask(id: string): Promise<void> {
    if (!confirm("Czy na pewno chcesz usunac to zadanie?")) {
      return;
    }

    const result = options.taskWorkflowService.deleteTask(id);
    if (!result.ok) {
      if (result.error) {
        alert(result.error);
      }
      return;
    }

    if (!(await dispatchNotifications(result.notifications))) {
      return;
    }
    if (!(await options.ensureStorageSynced())) {
      return;
    }

    if (options.getEditingTaskId() === id) {
      options.cancelTaskEdit();
    }

    if (options.getSelectedTaskId() === id) {
      options.setSelectedTaskId(null);
    }

    options.renderStories();
    options.renderTasks();
    options.renderTaskDetails();
  }

  async function assignSelectedTask(taskId: string): Promise<void> {
    const assigneeSelect =
      document.querySelector<HTMLSelectElement>("#details-assignee");
    const assigneeId = assigneeSelect?.value ?? "";

    if (!assigneeId) {
      alert("Wybierz osobe do przypisania.");
      return;
    }

    const result = options.taskWorkflowService.assignTask(taskId, assigneeId);
    if (!result.ok) {
      alert(result.error ?? "Nie udalo sie przypisac zadania.");
      return;
    }

    if (!(await dispatchNotifications(result.notifications))) {
      return;
    }
    if (!(await options.ensureStorageSynced())) {
      return;
    }

    options.renderStories();
    options.renderTasks();
    options.renderTaskDetails();
  }

  async function finishSelectedTask(taskId: string): Promise<void> {
    const task = options.taskService.getTaskById(taskId);
    if (!task) {
      return;
    }

    const workedHoursInput = document.querySelector<HTMLInputElement>(
      "#details-worked-hours",
    );
    const workedHours = Number.parseInt(
      workedHoursInput?.value ?? String(task.workedHours),
      10,
    );
    const safeWorkedHours =
      Number.isFinite(workedHours) && workedHours >= 0
        ? workedHours
        : task.workedHours;

    const result = options.taskWorkflowService.finishTask(task.id, safeWorkedHours);
    if (!result.ok) {
      alert(result.error ?? "Nie udalo sie zamknac zadania.");
      return;
    }

    if (!(await dispatchNotifications(result.notifications))) {
      return;
    }
    if (!(await options.ensureStorageSynced())) {
      return;
    }

    options.renderStories();
    options.renderTasks();
    options.renderTaskDetails();
  }

  function bindFormSubmits(): void {
    options.projectForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = options.projectNameInput.value.trim();
      const description = options.projectDescInput.value.trim();
      if (!name) {
        return;
      }

      const result = options.boardWorkflowService.upsertProject({
        editingProjectId: options.getEditingProjectId(),
        name,
        description,
        adminRecipientIds: options.getAdminUserIds(),
      });

      if (!result.ok) {
        alert(result.error ?? "Nie udalo sie zapisac projektu.");
        return;
      }
      if (!(await dispatchNotifications(result.notifications))) {
        return;
      }
      if (!(await options.ensureStorageSynced())) {
        return;
      }

      if (options.getEditingProjectId()) {
        options.cancelProjectEdit();
      } else {
        options.projectForm.reset();
      }

      options.renderProjects();
      options.renderStories();
      options.renderTaskStoryOptions();
      options.renderTasks();
      options.renderTaskDetails();
    });

    options.storyForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const activeProject = options.getActiveProject();
      if (!activeProject) {
        return;
      }

      const name = options.storyNameInput.value.trim();
      const description = options.storyDescInput.value.trim();
      const priority = options.storyPriorityInput.value as StoryPriority;
      const status = options.storyStatusInput.value as StoryStatus;
      const ownerId =
        options.storyOwnerInput.value || options.getRequiredLoggedInUserId();

      if (!name) {
        return;
      }

      const result = options.boardWorkflowService.upsertStory({
        editingStoryId: options.getEditingStoryId(),
        name,
        description,
        priority,
        status,
        projectId: activeProject.id,
        ownerId,
      });

      if (!result.ok) {
        alert(result.error ?? "Nie udalo sie zapisac historyjki.");
        return;
      }
      if (!(await dispatchNotifications(result.notifications))) {
        return;
      }
      if (!(await options.ensureStorageSynced())) {
        return;
      }

      options.cancelStoryEdit();

      options.renderStories();
      options.renderTaskStoryOptions();
      options.renderTasks();
      options.renderTaskDetails();
    });

    options.taskForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const activeProject = options.getActiveProject();
      if (!activeProject) {
        return;
      }

      const name = options.taskNameInput.value.trim();
      const description = options.taskDescInput.value.trim();
      const priority = options.taskPriorityInput.value as StoryPriority;
      const storyId = options.taskStoryInput.value;
      const estimatedHours = Number.parseInt(
        options.taskEstimatedHoursInput.value,
        10,
      );

      if (
        !name ||
        !storyId ||
        !Number.isFinite(estimatedHours) ||
        estimatedHours <= 0
      ) {
        return;
      }

      const result = options.boardWorkflowService.upsertTask({
        editingTaskId: options.getEditingTaskId(),
        name,
        description,
        priority,
        storyId,
        projectId: activeProject.id,
        estimatedHours,
      });

      if (!result.ok) {
        alert(result.error ?? "Nie udalo sie zapisac zadania.");
        return;
      }
      if (!(await dispatchNotifications(result.notifications))) {
        return;
      }
      if (!(await options.ensureStorageSynced())) {
        return;
      }

      if (options.getEditingTaskId()) {
        options.cancelTaskEdit();
      } else {
        options.setSelectedTaskId(result.selectedTaskId);
        options.cancelTaskEdit();
      }

      options.renderTasks();
      options.renderTaskDetails();
    });
  }

  return {
    deleteProject,
    deleteStory,
    deleteTask,
    assignSelectedTask,
    finishSelectedTask,
    bindFormSubmits,
  };
}
