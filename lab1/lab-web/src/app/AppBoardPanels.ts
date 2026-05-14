import type { Project } from "../models/Project";
import type { Story, StoryStatus } from "../models/Story";
import type { Task, TaskStatus } from "../models/Task";
import type { User, UserRole } from "../models/User";
import { ActiveProjectService } from "../services/ActiveProjectService";
import { ProjectService } from "../services/ProjectService";
import { StoryService } from "../services/StoryService";
import { TaskService } from "../services/TaskService";
import { UserService } from "../services/UserService";

type AppBoardPanelsOptions = {
  projectService: ProjectService;
  storyService: StoryService;
  taskService: TaskService;
  userService: UserService;
  activeProjectService: ActiveProjectService;
  projectCount: HTMLSpanElement;
  projectList: HTMLDivElement;
  activeProjectLabel: HTMLParagraphElement;
  storyForm: HTMLFormElement;
  storyBoard: HTMLDivElement;
  taskProjectLabel: HTMLParagraphElement;
  taskForm: HTMLFormElement;
  taskBoard: HTMLDivElement;
  taskDetails: HTMLDivElement;
  taskStoryInput: HTMLSelectElement;
  escapeHtml: (text: string) => string;
  formatDate: (dateString: string | null) => string;
  getRoleLabel: (role: UserRole) => string;
  getAssignableUsers: () => User[];
  getSelectedTaskId: () => string | null;
  setSelectedTaskId: (value: string | null) => void;
  onSetActiveProject: (projectId: string) => Promise<void>;
  onStartProjectEdit: (id: string) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onStartStoryEdit: (id: string) => void;
  onDeleteStory: (id: string) => Promise<void>;
  onStartTaskEdit: (id: string) => void;
  onDeleteTask: (id: string) => Promise<void>;
  onAssignTask: (taskId: string) => Promise<void>;
  onFinishTask: (taskId: string) => Promise<void>;
};

export function createAppBoardPanels(options: AppBoardPanelsOptions) {
  function getActiveProjectId(): string | null {
    const id = options.activeProjectService.getActiveProjectId();
    if (!id) {
      return null;
    }

    const exists = options.projectService.getProjectById(id);
    if (!exists) {
      options.activeProjectService.clearActiveProjectId();
      return null;
    }

    return id;
  }

  function getActiveProject(): Project | null {
    const activeId = getActiveProjectId();
    if (!activeId) {
      return null;
    }

    return options.projectService.getProjectById(activeId) ?? null;
  }

  function getActiveStories(): Story[] {
    const activeProject = getActiveProject();
    if (!activeProject) {
      return [];
    }

    return options.storyService.getStoriesByProject(activeProject.id);
  }

  function getStoryName(storyId: string): string {
    const story = options.storyService.getStoryById(storyId);
    return story ? story.name : "Nieznana historyjka";
  }

  function renderStoryCard(story: Story): string {
    const createdDate = new Date(story.createdAt).toLocaleDateString("pl-PL");
    return `
    <article class="story-card" data-id="${story.id}">
      <h4>${options.escapeHtml(story.name)}</h4>
      <p>${options.escapeHtml(story.description) || "<em>Brak opisu</em>"}</p>
      <div class="story-meta">
        <span>Priorytet: ${story.priority}</span>
        <span>Data: ${createdDate}</span>
      </div>
      <div class="story-actions">
        <button class="btn btn-edit btn-story-edit" data-id="${story.id}">Edytuj</button>
        <button class="btn btn-delete btn-story-delete" data-id="${story.id}">Usun</button>
      </div>
    </article>
  `;
  }

  function renderTaskCard(task: Task): string {
    return `
    <article class="task-card ${options.getSelectedTaskId() === task.id ? "selected" : ""}">
      <h4>${options.escapeHtml(task.name)}</h4>
      <p>${options.escapeHtml(task.description) || "<em>Brak opisu</em>"}</p>
      <div class="task-meta">
        <span>Historyjka: ${options.escapeHtml(getStoryName(task.storyId))}</span>
        <span>Priorytet: ${task.priority}</span>
      </div>
      <div class="task-meta">
        <span>Plan: ${task.estimatedHours}h</span>
        <span>Wykonane: ${task.workedHours}h</span>
      </div>
      <div class="story-actions">
        <button class="btn btn-select btn-task-details" data-id="${task.id}">Szczegoly</button>
        <button class="btn btn-edit btn-task-edit" data-id="${task.id}">Edytuj</button>
        <button class="btn btn-delete btn-task-delete" data-id="${task.id}">Usun</button>
      </div>
    </article>
  `;
  }

  function renderProjects(): void {
    const projects = options.projectService.getProjects();
    const activeProjectId = getActiveProjectId();
    options.projectCount.textContent = String(projects.length);

    if (projects.length === 0) {
      options.activeProjectService.clearActiveProjectId();
      options.projectList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📂</span>
        <p>Brak projektow. Dodaj pierwszy projekt.</p>
      </div>
    `;
      return;
    }

    options.projectList.innerHTML = projects
      .map(
        (project: Project) => `
      <div class="project-card ${activeProjectId === project.id ? "active" : ""}" data-id="${project.id}">
        <div class="project-info">
          <h3 class="project-name">${options.escapeHtml(project.name)}</h3>
          <p class="project-desc">${options.escapeHtml(project.description) || "<em>Brak opisu</em>"}</p>
          <span class="project-id">ID: ${project.id}</span>
        </div>
        <div class="project-actions">
          <button class="btn btn-select" data-id="${project.id}">${activeProjectId === project.id ? "Aktywny" : "Ustaw aktywny"}</button>
          <button class="btn btn-edit" data-id="${project.id}">Edytuj</button>
          <button class="btn btn-delete" data-id="${project.id}">Usun</button>
        </div>
      </div>
    `,
      )
      .join("");

    options.projectList.querySelectorAll(".btn-select").forEach((button) => {
      button.addEventListener("click", () =>
        void options.onSetActiveProject((button as HTMLElement).dataset.id!),
      );
    });

    options.projectList.querySelectorAll(".btn-edit").forEach((button) => {
      button.addEventListener("click", () =>
        options.onStartProjectEdit((button as HTMLElement).dataset.id!),
      );
    });

    options.projectList.querySelectorAll(".btn-delete").forEach((button) => {
      button.addEventListener("click", () =>
        void options.onDeleteProject((button as HTMLElement).dataset.id!),
      );
    });
  }

  function renderStories(): void {
    const activeProject = getActiveProject();
    if (!activeProject) {
      options.activeProjectLabel.textContent =
        "Wybierz aktywny projekt, aby zarzadzac historyjkami.";
      options.storyForm.classList.add("hidden");
      options.storyBoard.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🧭</span>
        <p>Brak aktywnego projektu.</p>
      </div>
    `;
      return;
    }

    options.activeProjectLabel.textContent = `Aktywny projekt: ${activeProject.name}`;
    options.storyForm.classList.remove("hidden");

    const stories = options.storyService.getStoriesByProject(activeProject.id);
    const groups: { status: StoryStatus; title: string }[] = [
      { status: "todo", title: "Todo" },
      { status: "doing", title: "Doing" },
      { status: "done", title: "Done" },
    ];

    options.storyBoard.innerHTML = groups
      .map(({ status, title }) => {
        const storiesInGroup = stories.filter((story) => story.status === status);
        return `
        <div class="story-column">
          <h3>${title} <span class="badge">${storiesInGroup.length}</span></h3>
          <div class="story-list">
            ${
              storiesInGroup.length === 0
                ? '<p class="column-empty">Brak historyjek</p>'
                : storiesInGroup.map((story) => renderStoryCard(story)).join("")
            }
          </div>
        </div>
      `;
      })
      .join("");

    options.storyBoard.querySelectorAll(".btn-story-edit").forEach((button) => {
      button.addEventListener("click", () =>
        options.onStartStoryEdit((button as HTMLElement).dataset.id!),
      );
    });

    options.storyBoard.querySelectorAll(".btn-story-delete").forEach((button) => {
      button.addEventListener("click", () =>
        void options.onDeleteStory((button as HTMLElement).dataset.id!),
      );
    });
  }

  function renderTaskStoryOptions(): void {
    const stories = getActiveStories();
    const selected = options.taskStoryInput.value;

    if (stories.length === 0) {
      options.taskStoryInput.innerHTML =
        '<option value="">Brak historyjek w projekcie</option>';
      options.taskStoryInput.disabled = true;
      return;
    }

    options.taskStoryInput.disabled = false;
    options.taskStoryInput.innerHTML = stories
      .map(
        (story) =>
          `<option value="${story.id}">${options.escapeHtml(story.name)}</option>`,
      )
      .join("");

    if (selected && stories.some((story) => story.id === selected)) {
      options.taskStoryInput.value = selected;
    }
  }

  function renderTasks(): void {
    const activeProject = getActiveProject();
    if (!activeProject) {
      options.taskProjectLabel.textContent =
        "Wybierz aktywny projekt, aby zarzadzac zadaniami.";
      options.taskForm.classList.add("hidden");
      options.taskBoard.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🧩</span>
        <p>Brak aktywnego projektu.</p>
      </div>
    `;
      return;
    }

    options.taskProjectLabel.textContent = `Aktywny projekt: ${activeProject.name}`;
    options.taskForm.classList.remove("hidden");

    const tasks = options.taskService.getTasksByProject(activeProject.id);
    const groups: { status: TaskStatus; title: string }[] = [
      { status: "todo", title: "Todo" },
      { status: "doing", title: "Doing" },
      { status: "done", title: "Done" },
    ];

    options.taskBoard.innerHTML = groups
      .map(({ status, title }) => {
        const tasksInGroup = tasks.filter((task) => task.status === status);
        return `
        <div class="task-column">
          <h3>${title} <span class="badge">${tasksInGroup.length}</span></h3>
          <div class="task-list">
            ${
              tasksInGroup.length === 0
                ? '<p class="column-empty">Brak zadan</p>'
                : tasksInGroup.map((task) => renderTaskCard(task)).join("")
            }
          </div>
        </div>
      `;
      })
      .join("");

    options.taskBoard.querySelectorAll(".btn-task-edit").forEach((button) => {
      button.addEventListener("click", () =>
        options.onStartTaskEdit((button as HTMLElement).dataset.id!),
      );
    });

    options.taskBoard.querySelectorAll(".btn-task-delete").forEach((button) => {
      button.addEventListener("click", () =>
        void options.onDeleteTask((button as HTMLElement).dataset.id!),
      );
    });

    options.taskBoard.querySelectorAll(".btn-task-details").forEach((button) => {
      button.addEventListener("click", () => {
        options.setSelectedTaskId((button as HTMLElement).dataset.id!);
        renderTaskDetails();
      });
    });
  }

  function renderTaskDetails(): void {
    const selectedTaskId = options.getSelectedTaskId();
    const task = selectedTaskId ? options.taskService.getTaskById(selectedTaskId) : null;
    if (!task) {
      options.taskDetails.innerHTML = `
      <h3>Szczegoly zadania</h3>
      <p class="column-empty">Wybierz zadanie z tablicy, aby zobaczyc szczegoly i zarzadzac przypisaniem.</p>
    `;
      return;
    }

    const story = options.storyService.getStoryById(task.storyId);
    const assignee = task.assigneeId
      ? options.userService.getUserById(task.assigneeId)
      : null;

    options.taskDetails.innerHTML = `
    <h3>Szczegoly zadania</h3>
    <div class="details-grid">
      <p><strong>Nazwa:</strong> ${options.escapeHtml(task.name)}</p>
      <p><strong>Stan:</strong> ${task.status}</p>
      <p><strong>Priorytet:</strong> ${task.priority}</p>
      <p><strong>Historyjka:</strong> ${story ? options.escapeHtml(story.name) : "-"}</p>
      <p><strong>Data dodania:</strong> ${options.formatDate(task.createdAt)}</p>
      <p><strong>Data startu:</strong> ${options.formatDate(task.startedAt)}</p>
      <p><strong>Data zakonczenia:</strong> ${options.formatDate(task.finishedAt)}</p>
      <p><strong>Planowane h:</strong> ${task.estimatedHours}</p>
      <p><strong>Zrealizowane h:</strong> ${task.workedHours}</p>
      <p><strong>Przypisana osoba:</strong> ${
        assignee
          ? `${options.escapeHtml(assignee.firstName)} ${options.escapeHtml(assignee.lastName)} (${options.getRoleLabel(assignee.role)})`
          : "Brak"
      }</p>
    </div>

    <div class="details-actions">
      <label for="details-assignee">Przypisz osobe (developer/devops)</label>
      <div class="details-row">
        <select id="details-assignee">
          <option value="">Wybierz osobe</option>
          ${options
            .getAssignableUsers()
            .map(
              (user) =>
                `<option value="${user.id}" ${task.assigneeId === user.id ? "selected" : ""}>${options.escapeHtml(user.firstName)} ${options.escapeHtml(user.lastName)} (${options.getRoleLabel(user.role)})</option>`,
            )
            .join("")}
        </select>
        <button id="assign-task-btn" class="btn btn-primary" type="button">Przypisz</button>
      </div>

      <label for="details-worked-hours">Zrealizowane roboczogodziny</label>
      <div class="details-row">
        <input id="details-worked-hours" type="number" min="0" step="1" value="${task.workedHours}" />
        <button id="finish-task-btn" class="btn btn-select" type="button">Oznacz jako done</button>
      </div>
      <p class="details-hint">Przypisanie osoby zmienia todo na doing i ustawia date startu. Oznaczenie done ustawia date zakonczenia.</p>
    </div>
  `;

    const assignButton =
      document.querySelector<HTMLButtonElement>("#assign-task-btn");
    assignButton?.addEventListener("click", () => void options.onAssignTask(task.id));

    const finishButton =
      document.querySelector<HTMLButtonElement>("#finish-task-btn");
    finishButton?.addEventListener("click", () => void options.onFinishTask(task.id));
  }

  return {
    getActiveProjectId,
    getActiveProject,
    getActiveStories,
    getStoryName,
    renderProjects,
    renderStories,
    renderTaskStoryOptions,
    renderTasks,
    renderTaskDetails,
  };
}
