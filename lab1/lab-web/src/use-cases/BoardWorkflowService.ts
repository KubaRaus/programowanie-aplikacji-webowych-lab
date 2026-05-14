import type { StoryPriority, StoryStatus } from "../models/Story";
import type {
  IActiveProjectStore,
  IProjectRepository,
  IStoryRepository,
  ITaskRepository,
} from "../ports/Repositories";
import type { NotificationDraft, WorkflowResult } from "./WorkflowTypes";

type UpsertProjectResult = WorkflowResult & {
  activatedProjectId?: string;
};

type DeleteProjectResult = WorkflowResult & {
  clearedSelectedTask: boolean;
};

type UpsertTaskResult = WorkflowResult & {
  selectedTaskId: string | null;
};

type DeleteStoryResult = WorkflowResult & {
  clearedSelectedTask: boolean;
};

export class BoardWorkflowService {
  private readonly projectRepository: IProjectRepository;
  private readonly storyRepository: IStoryRepository;
  private readonly taskRepository: ITaskRepository;
  private readonly activeProjectStore: IActiveProjectStore;

  constructor(
    projectRepository: IProjectRepository,
    storyRepository: IStoryRepository,
    taskRepository: ITaskRepository,
    activeProjectStore: IActiveProjectStore,
  ) {
    this.projectRepository = projectRepository;
    this.storyRepository = storyRepository;
    this.taskRepository = taskRepository;
    this.activeProjectStore = activeProjectStore;
  }

  upsertProject(input: {
    editingProjectId: string | null;
    name: string;
    description: string;
    adminRecipientIds: string[];
  }): UpsertProjectResult {
    if (input.editingProjectId) {
      const updated = this.projectRepository.updateProject(
        input.editingProjectId,
        input.name,
        input.description,
      );
      if (!updated) {
        return {
          ok: false,
          error: "Nie znaleziono projektu do edycji.",
          notifications: [],
        };
      }
      return { ok: true, notifications: [] };
    }

    const created = this.projectRepository.createProject(input.name, input.description);
    const notifications: NotificationDraft[] = [
      {
        title: "Utworzono nowy projekt",
        message: `Dodano projekt "${created.name}".`,
        priority: "high",
        recipientIds: input.adminRecipientIds,
      },
    ];

    const currentActiveProjectId = this.activeProjectStore.getActiveProjectId();
    const activatedProjectId = currentActiveProjectId ? undefined : created.id;
    if (activatedProjectId) {
      this.activeProjectStore.setActiveProjectId(activatedProjectId);
    }

    return { ok: true, notifications, activatedProjectId };
  }

  deleteProject(projectId: string): DeleteProjectResult {
    const deleted = this.projectRepository.deleteProject(projectId);
    if (!deleted) {
      return { ok: false, error: "Nie znaleziono projektu.", notifications: [], clearedSelectedTask: false };
    }

    this.storyRepository.deleteStoriesByProject(projectId);
    this.taskRepository.deleteTasksByProject(projectId);

    if (this.activeProjectStore.getActiveProjectId() === projectId) {
      const remainingProjects = this.projectRepository.getProjects();
      if (remainingProjects.length > 0) {
        this.activeProjectStore.setActiveProjectId(remainingProjects[0].id);
      } else {
        this.activeProjectStore.clearActiveProjectId();
      }
    }

    return { ok: true, notifications: [], clearedSelectedTask: true };
  }

  upsertStory(input: {
    editingStoryId: string | null;
    name: string;
    description: string;
    priority: StoryPriority;
    status: StoryStatus;
    projectId: string;
    ownerId: string;
  }): WorkflowResult {
    if (input.editingStoryId) {
      const existingStory = this.storyRepository.getStoryById(input.editingStoryId);
      if (!existingStory) {
        return {
          ok: false,
          error: "Nie znaleziono historyjki do edycji.",
          notifications: [],
        };
      }

      const updated = this.storyRepository.updateStory(input.editingStoryId, {
        name: input.name,
        description: input.description,
        priority: input.priority,
        status: input.status,
        ownerId: input.ownerId,
      });
      if (!updated) {
        return {
          ok: false,
          error: "Nie znaleziono historyjki do edycji.",
          notifications: [],
        };
      }

      const notifications: NotificationDraft[] = [];
      if (existingStory.ownerId !== input.ownerId) {
        notifications.push({
          title: "Przypisano Cie do historyjki",
          message: `Historyjka "${updated.name}" zostala przypisana do Ciebie.`,
          priority: "high",
          recipientIds: [input.ownerId],
        });
      }

      return { ok: true, notifications };
    }

    const created = this.storyRepository.createStory({
      name: input.name,
      description: input.description,
      priority: input.priority,
      projectId: input.projectId,
      status: input.status,
      ownerId: input.ownerId,
    });
    return {
      ok: true,
      notifications: [
        {
          title: "Przypisano Cie do historyjki",
          message: `Historyjka "${created.name}" zostala przypisana do Ciebie.`,
          priority: "high",
          recipientIds: [input.ownerId],
        },
      ],
    };
  }

  deleteStory(storyId: string, selectedTaskId: string | null): DeleteStoryResult {
    const deleted = this.storyRepository.deleteStory(storyId);
    if (!deleted) {
      return {
        ok: false,
        error: "Nie znaleziono historyjki.",
        notifications: [],
        clearedSelectedTask: false,
      };
    }

    this.taskRepository.deleteTasksByStory(storyId);
    const selectedTask = selectedTaskId
      ? this.taskRepository.getTaskById(selectedTaskId)
      : null;

    return {
      ok: true,
      notifications: [],
      clearedSelectedTask: Boolean(selectedTask && selectedTask.storyId === storyId),
    };
  }

  upsertTask(input: {
    editingTaskId: string | null;
    name: string;
    description: string;
    priority: StoryPriority;
    storyId: string;
    projectId: string;
    estimatedHours: number;
  }): UpsertTaskResult {
    if (input.editingTaskId) {
      const existing = this.taskRepository.getTaskById(input.editingTaskId);
      if (!existing) {
        return {
          ok: false,
          error: "Nie znaleziono zadania do edycji.",
          notifications: [],
          selectedTaskId: null,
        };
      }

      const updated = this.taskRepository.updateTask(input.editingTaskId, {
        name: input.name,
        description: input.description,
        priority: input.priority,
        storyId: input.storyId,
        projectId: input.projectId,
        estimatedHours: input.estimatedHours,
        workedHours: existing.workedHours,
      });

      if (!updated) {
        return {
          ok: false,
          error: "Nie udalo sie zaktualizowac zadania.",
          notifications: [],
          selectedTaskId: null,
        };
      }

      return { ok: true, notifications: [], selectedTaskId: null };
    }

    const created = this.taskRepository.createTask({
      name: input.name,
      description: input.description,
      priority: input.priority,
      storyId: input.storyId,
      projectId: input.projectId,
      estimatedHours: input.estimatedHours,
    });

    const notifications: NotificationDraft[] = [];
    const taskStory = this.storyRepository.getStoryById(created.storyId);
    if (taskStory) {
      notifications.push({
        title: "Nowe zadanie w historyjce",
        message: `Dodano zadanie "${created.name}" w historyjce "${taskStory.name}".`,
        priority: "medium",
        recipientIds: [taskStory.ownerId],
      });
    }

    return {
      ok: true,
      notifications,
      selectedTaskId: created.id,
    };
  }
}
