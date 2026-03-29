import "./style.css";
import type { Project } from "./models/Project";
import type { Story, StoryPriority, StoryStatus } from "./models/Story";
import type { Task, TaskStatus } from "./models/Task";
import { ActiveProjectService } from "./services/ActiveProjectService";
import { ProjectService } from "./services/ProjectService";
import { StoryService } from "./services/StoryService";
import { TaskService } from "./services/TaskService";
import { UserService } from "./services/UserService";

const projectService = new ProjectService();
const storyService = new StoryService();
const taskService = new TaskService();
const userService = new UserService();
const activeProjectService = new ActiveProjectService();

const loggedInUser = userService.getLoggedInUser();
const assignableUsers = userService.getAssignableUsers();

let editingProjectId: string | null = null;
let editingStoryId: string | null = null;
let editingTaskId: string | null = null;
let selectedTaskId: string | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="container">
    <header>
      <h1>ManageMe</h1>
      <p class="subtitle">Zarzadzaj projektami, historyjkami i zadaniami</p>
      <p class="logged-user">Zalogowany: <strong id="logged-user-name"></strong></p>
      <button type="button" id="theme-toggle-btn" class="theme-toggle">🌙 Ciemny</button>
    </header>

    <section class="form-section">
      <h2 id="project-form-title">Nowy projekt</h2>
      <form id="project-form">
        <div class="form-group">
          <label for="project-name">Nazwa projektu</label>
          <input type="text" id="project-name" placeholder="Wpisz nazwe..." required />
        </div>
        <div class="form-group">
          <label for="project-desc">Opis</label>
          <textarea id="project-desc" placeholder="Opisz projekt..." rows="3"></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" id="project-submit-btn" class="btn btn-primary">Dodaj projekt</button>
          <button type="button" id="project-cancel-btn" class="btn btn-secondary hidden">Anuluj</button>
        </div>
      </form>
    </section>

    <section class="list-section">
      <h2>Projekty <span id="project-count" class="badge">0</span></h2>
      <div id="project-list" class="project-list"></div>
    </section>

    <section class="story-section">
      <div class="story-header">
        <h2>Historyjki</h2>
        <p id="active-project-label" class="active-project-label"></p>
      </div>

      <form id="story-form" class="story-form hidden">
        <h3 id="story-form-title">Nowa historyjka</h3>
        <div class="form-group">
          <label for="story-name">Nazwa</label>
          <input type="text" id="story-name" placeholder="Np. Logowanie przez SSO" required />
        </div>
        <div class="form-group">
          <label for="story-desc">Opis</label>
          <textarea id="story-desc" rows="3" placeholder="Szczegoly historyjki..."></textarea>
        </div>
        <div class="story-grid">
          <div class="form-group">
            <label for="story-priority">Priorytet</label>
            <select id="story-priority">
              <option value="niski">Niski</option>
              <option value="sredni" selected>Sredni</option>
              <option value="wysoki">Wysoki</option>
            </select>
          </div>
          <div class="form-group">
            <label for="story-status">Stan</label>
            <select id="story-status">
              <option value="todo" selected>Todo</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" id="story-submit-btn" class="btn btn-primary">Dodaj historyjke</button>
          <button type="button" id="story-cancel-btn" class="btn btn-secondary hidden">Anuluj</button>
        </div>
      </form>

      <div id="story-board" class="story-board"></div>
    </section>

    <section class="task-section">
      <div class="task-header">
        <h2>Zadania</h2>
        <p id="task-project-label" class="active-project-label"></p>
      </div>

      <form id="task-form" class="task-form hidden">
        <h3 id="task-form-title">Nowe zadanie</h3>
        <div class="form-group">
          <label for="task-name">Nazwa</label>
          <input type="text" id="task-name" placeholder="Np. Konfiguracja pipeline CI" required />
        </div>
        <div class="form-group">
          <label for="task-desc">Opis</label>
          <textarea id="task-desc" rows="3" placeholder="Szczegoly zadania..."></textarea>
        </div>
        <div class="task-grid">
          <div class="form-group">
            <label for="task-priority">Priorytet</label>
            <select id="task-priority">
              <option value="niski">Niski</option>
              <option value="sredni" selected>Sredni</option>
              <option value="wysoki">Wysoki</option>
            </select>
          </div>
          <div class="form-group">
            <label for="task-story">Historyjka</label>
            <select id="task-story"></select>
          </div>
          <div class="form-group">
            <label for="task-estimated-hours">Przewidywany czas (h)</label>
            <input type="number" id="task-estimated-hours" min="1" step="1" value="1" required />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" id="task-submit-btn" class="btn btn-primary">Dodaj zadanie</button>
          <button type="button" id="task-cancel-btn" class="btn btn-secondary hidden">Anuluj</button>
        </div>
      </form>

      <div id="task-board" class="task-board"></div>
      <div id="task-details" class="task-details"></div>
    </section>
  </div>
`;

const loggedUserName =
  document.querySelector<HTMLSpanElement>("#logged-user-name")!;

const projectForm = document.querySelector<HTMLFormElement>("#project-form")!;
const projectNameInput =
  document.querySelector<HTMLInputElement>("#project-name")!;
const projectDescInput =
  document.querySelector<HTMLTextAreaElement>("#project-desc")!;
const projectSubmitBtn = document.querySelector<HTMLButtonElement>(
  "#project-submit-btn",
)!;
const projectCancelBtn = document.querySelector<HTMLButtonElement>(
  "#project-cancel-btn",
)!;
const projectFormTitle = document.querySelector<HTMLHeadingElement>(
  "#project-form-title",
)!;
const projectList = document.querySelector<HTMLDivElement>("#project-list")!;
const projectCount = document.querySelector<HTMLSpanElement>("#project-count")!;

const activeProjectLabel = document.querySelector<HTMLParagraphElement>(
  "#active-project-label",
)!;
const storyForm = document.querySelector<HTMLFormElement>("#story-form")!;
const storyFormTitle =
  document.querySelector<HTMLHeadingElement>("#story-form-title")!;
const storyNameInput = document.querySelector<HTMLInputElement>("#story-name")!;
const storyDescInput =
  document.querySelector<HTMLTextAreaElement>("#story-desc")!;
const storyPriorityInput =
  document.querySelector<HTMLSelectElement>("#story-priority")!;
const storyStatusInput =
  document.querySelector<HTMLSelectElement>("#story-status")!;
const storySubmitBtn =
  document.querySelector<HTMLButtonElement>("#story-submit-btn")!;
const storyCancelBtn =
  document.querySelector<HTMLButtonElement>("#story-cancel-btn")!;
const storyBoard = document.querySelector<HTMLDivElement>("#story-board")!;

const taskProjectLabel = document.querySelector<HTMLParagraphElement>(
  "#task-project-label",
)!;
const taskForm = document.querySelector<HTMLFormElement>("#task-form")!;
const taskFormTitle =
  document.querySelector<HTMLHeadingElement>("#task-form-title")!;
const taskNameInput = document.querySelector<HTMLInputElement>("#task-name")!;
const taskDescInput =
  document.querySelector<HTMLTextAreaElement>("#task-desc")!;
const taskPriorityInput =
  document.querySelector<HTMLSelectElement>("#task-priority")!;
const taskStoryInput =
  document.querySelector<HTMLSelectElement>("#task-story")!;
const taskEstimatedHoursInput = document.querySelector<HTMLInputElement>(
  "#task-estimated-hours",
)!;
const taskSubmitBtn =
  document.querySelector<HTMLButtonElement>("#task-submit-btn")!;
const taskCancelBtn =
  document.querySelector<HTMLButtonElement>("#task-cancel-btn")!;
const taskBoard = document.querySelector<HTMLDivElement>("#task-board")!;
const taskDetails = document.querySelector<HTMLDivElement>("#task-details")!;
const themeToggleBtn = document.querySelector<HTMLButtonElement>(
  "#theme-toggle-btn",
)!;

const THEME_STORAGE_KEY = "manageme-theme";
type Theme = "light" | "dark";

function updateThemeToggleLabel(theme: Theme): void {
  themeToggleBtn.textContent = theme === "dark" ? "☀️ Jasny" : "🌙 Ciemny";
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  updateThemeToggleLabel(theme);
}

function getThemePreference(): Theme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function initThemeToggle(): void {
  applyTheme(getThemePreference());

  themeToggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");
    const nextTheme: Theme = isDark ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  });

  const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  darkMediaQuery.addEventListener("change", (event) => {
    const hasSavedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (hasSavedTheme) {
      return;
    }

    applyTheme(event.matches ? "dark" : "light");
  });
}

function getActiveProjectId(): string | null {
  const id = activeProjectService.getActiveProjectId();
  if (!id) {
    return null;
  }

  const exists = projectService.getProjectById(id);
  if (!exists) {
    activeProjectService.clearActiveProjectId();
    return null;
  }

  return id;
}

function getActiveProject(): Project | null {
  const activeId = getActiveProjectId();
  if (!activeId) {
    return null;
  }

  return projectService.getProjectById(activeId) ?? null;
}

function getActiveStories(): Story[] {
  const activeProject = getActiveProject();
  if (!activeProject) {
    return [];
  }

  return storyService.getStoriesByProject(activeProject.id);
}

function getStoryName(storyId: string): string {
  const story = storyService.getStoryById(storyId);
  return story ? story.name : "Nieznana historyjka";
}

function formatDate(dateString: string | null): string {
  if (!dateString) {
    return "-";
  }

  return new Date(dateString).toLocaleString("pl-PL");
}

function setActiveProject(projectId: string): void {
  activeProjectService.setActiveProjectId(projectId);
  cancelStoryEdit();
  cancelTaskEdit();
  selectedTaskId = null;
  renderProjects();
  renderStories();
  renderTaskStoryOptions();
  renderTasks();
  renderTaskDetails();
}

function renderProjects(): void {
  const projects = projectService.getProjects();
  const activeProjectId = getActiveProjectId();
  projectCount.textContent = String(projects.length);

  if (projects.length === 0) {
    activeProjectService.clearActiveProjectId();
    projectList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📂</span>
        <p>Brak projektow. Dodaj pierwszy projekt.</p>
      </div>
    `;
    return;
  }

  projectList.innerHTML = projects
    .map(
      (project: Project) => `
      <div class="project-card ${activeProjectId === project.id ? "active" : ""}" data-id="${project.id}">
        <div class="project-info">
          <h3 class="project-name">${escapeHtml(project.name)}</h3>
          <p class="project-desc">${escapeHtml(project.description) || "<em>Brak opisu</em>"}</p>
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

  projectList.querySelectorAll(".btn-select").forEach((button) => {
    button.addEventListener("click", () =>
      setActiveProject((button as HTMLElement).dataset.id!),
    );
  });

  projectList.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", () =>
      startProjectEdit((button as HTMLElement).dataset.id!),
    );
  });

  projectList.querySelectorAll(".btn-delete").forEach((button) => {
    button.addEventListener("click", () =>
      deleteProject((button as HTMLElement).dataset.id!),
    );
  });
}

function startProjectEdit(id: string): void {
  const project = projectService.getProjectById(id);
  if (!project) {
    return;
  }

  editingProjectId = id;
  projectNameInput.value = project.name;
  projectDescInput.value = project.description;
  projectFormTitle.textContent = "Edytuj projekt";
  projectSubmitBtn.textContent = "Zapisz zmiany";
  projectCancelBtn.classList.remove("hidden");
  projectNameInput.focus();
}

function cancelProjectEdit(): void {
  editingProjectId = null;
  projectForm.reset();
  projectFormTitle.textContent = "Nowy projekt";
  projectSubmitBtn.textContent = "Dodaj projekt";
  projectCancelBtn.classList.add("hidden");
}

function deleteProject(id: string): void {
  if (!confirm("Czy na pewno chcesz usunac ten projekt?")) {
    return;
  }

  projectService.deleteProject(id);
  storyService.deleteStoriesByProject(id);
  taskService.deleteTasksByProject(id);

  if (editingProjectId === id) {
    cancelProjectEdit();
  }

  if (getActiveProjectId() === id) {
    const remainingProjects = projectService.getProjects();
    if (remainingProjects.length > 0) {
      activeProjectService.setActiveProjectId(remainingProjects[0].id);
    } else {
      activeProjectService.clearActiveProjectId();
    }
  }

  selectedTaskId = null;
  cancelStoryEdit();
  cancelTaskEdit();
  renderProjects();
  renderStories();
  renderTaskStoryOptions();
  renderTasks();
  renderTaskDetails();
}

function renderStories(): void {
  const activeProject = getActiveProject();
  if (!activeProject) {
    activeProjectLabel.textContent =
      "Wybierz aktywny projekt, aby zarzadzac historyjkami.";
    storyForm.classList.add("hidden");
    storyBoard.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🧭</span>
        <p>Brak aktywnego projektu.</p>
      </div>
    `;
    return;
  }

  activeProjectLabel.textContent = `Aktywny projekt: ${activeProject.name}`;
  storyForm.classList.remove("hidden");

  const stories = storyService.getStoriesByProject(activeProject.id);
  const groups: { status: StoryStatus; title: string }[] = [
    { status: "todo", title: "Todo" },
    { status: "doing", title: "Doing" },
    { status: "done", title: "Done" },
  ];

  storyBoard.innerHTML = groups
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

  storyBoard.querySelectorAll(".btn-story-edit").forEach((button) => {
    button.addEventListener("click", () =>
      startStoryEdit((button as HTMLElement).dataset.id!),
    );
  });

  storyBoard.querySelectorAll(".btn-story-delete").forEach((button) => {
    button.addEventListener("click", () =>
      deleteStory((button as HTMLElement).dataset.id!),
    );
  });
}

function renderStoryCard(story: Story): string {
  const createdDate = new Date(story.createdAt).toLocaleDateString("pl-PL");
  return `
    <article class="story-card" data-id="${story.id}">
      <h4>${escapeHtml(story.name)}</h4>
      <p>${escapeHtml(story.description) || "<em>Brak opisu</em>"}</p>
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

function startStoryEdit(id: string): void {
  const story = storyService.getStoryById(id);
  if (!story) {
    return;
  }

  editingStoryId = id;
  storyNameInput.value = story.name;
  storyDescInput.value = story.description;
  storyPriorityInput.value = story.priority;
  storyStatusInput.value = story.status;
  storyFormTitle.textContent = "Edytuj historyjke";
  storySubmitBtn.textContent = "Zapisz zmiany";
  storyCancelBtn.classList.remove("hidden");
  storyNameInput.focus();
}

function cancelStoryEdit(): void {
  editingStoryId = null;
  storyForm.reset();
  storyPriorityInput.value = "sredni";
  storyStatusInput.value = "todo";
  storyFormTitle.textContent = "Nowa historyjka";
  storySubmitBtn.textContent = "Dodaj historyjke";
  storyCancelBtn.classList.add("hidden");
}

function deleteStory(id: string): void {
  if (!confirm("Czy na pewno chcesz usunac te historyjke?")) {
    return;
  }

  storyService.deleteStory(id);
  taskService.deleteTasksByStory(id);

  if (editingStoryId === id) {
    cancelStoryEdit();
  }

  const selectedTask = selectedTaskId
    ? taskService.getTaskById(selectedTaskId)
    : null;
  if (selectedTask && selectedTask.storyId === id) {
    selectedTaskId = null;
  }

  renderStories();
  renderTaskStoryOptions();
  renderTasks();
  renderTaskDetails();
}

function renderTaskStoryOptions(): void {
  const stories = getActiveStories();
  const selected = taskStoryInput.value;

  if (stories.length === 0) {
    taskStoryInput.innerHTML =
      '<option value="">Brak historyjek w projekcie</option>';
    taskStoryInput.disabled = true;
    return;
  }

  taskStoryInput.disabled = false;
  taskStoryInput.innerHTML = stories
    .map(
      (story) =>
        `<option value="${story.id}">${escapeHtml(story.name)}</option>`,
    )
    .join("");

  if (selected && stories.some((story) => story.id === selected)) {
    taskStoryInput.value = selected;
  }
}

function renderTasks(): void {
  const activeProject = getActiveProject();
  if (!activeProject) {
    taskProjectLabel.textContent =
      "Wybierz aktywny projekt, aby zarzadzac zadaniami.";
    taskForm.classList.add("hidden");
    taskBoard.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🧩</span>
        <p>Brak aktywnego projektu.</p>
      </div>
    `;
    return;
  }

  taskProjectLabel.textContent = `Aktywny projekt: ${activeProject.name}`;
  taskForm.classList.remove("hidden");

  const tasks = taskService.getTasksByProject(activeProject.id);
  const groups: { status: TaskStatus; title: string }[] = [
    { status: "todo", title: "Todo" },
    { status: "doing", title: "Doing" },
    { status: "done", title: "Done" },
  ];

  taskBoard.innerHTML = groups
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

  taskBoard.querySelectorAll(".btn-task-edit").forEach((button) => {
    button.addEventListener("click", () =>
      startTaskEdit((button as HTMLElement).dataset.id!),
    );
  });

  taskBoard.querySelectorAll(".btn-task-delete").forEach((button) => {
    button.addEventListener("click", () =>
      deleteTask((button as HTMLElement).dataset.id!),
    );
  });

  taskBoard.querySelectorAll(".btn-task-details").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTaskId = (button as HTMLElement).dataset.id!;
      renderTaskDetails();
    });
  });
}

function renderTaskCard(task: Task): string {
  return `
    <article class="task-card ${selectedTaskId === task.id ? "selected" : ""}">
      <h4>${escapeHtml(task.name)}</h4>
      <p>${escapeHtml(task.description) || "<em>Brak opisu</em>"}</p>
      <div class="task-meta">
        <span>Historyjka: ${escapeHtml(getStoryName(task.storyId))}</span>
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

function renderTaskDetails(): void {
  const task = selectedTaskId ? taskService.getTaskById(selectedTaskId) : null;
  if (!task) {
    taskDetails.innerHTML = `
      <h3>Szczegoly zadania</h3>
      <p class="column-empty">Wybierz zadanie z tablicy, aby zobaczyc szczegoly i zarzadzac przypisaniem.</p>
    `;
    return;
  }

  const story = storyService.getStoryById(task.storyId);
  const assignee = task.assigneeId
    ? userService.getUserById(task.assigneeId)
    : null;

  taskDetails.innerHTML = `
    <h3>Szczegoly zadania</h3>
    <div class="details-grid">
      <p><strong>Nazwa:</strong> ${escapeHtml(task.name)}</p>
      <p><strong>Stan:</strong> ${task.status}</p>
      <p><strong>Priorytet:</strong> ${task.priority}</p>
      <p><strong>Historyjka:</strong> ${story ? escapeHtml(story.name) : "-"}</p>
      <p><strong>Data dodania:</strong> ${formatDate(task.createdAt)}</p>
      <p><strong>Data startu:</strong> ${formatDate(task.startedAt)}</p>
      <p><strong>Data zakonczenia:</strong> ${formatDate(task.finishedAt)}</p>
      <p><strong>Planowane h:</strong> ${task.estimatedHours}</p>
      <p><strong>Zrealizowane h:</strong> ${task.workedHours}</p>
      <p><strong>Przypisana osoba:</strong> ${assignee ? `${assignee.firstName} ${assignee.lastName} (${assignee.role})` : "Brak"}</p>
    </div>

    <div class="details-actions">
      <label for="details-assignee">Przypisz osobe (developer/devops)</label>
      <div class="details-row">
        <select id="details-assignee">
          <option value="">Wybierz osobe</option>
          ${assignableUsers
            .map(
              (user) =>
                `<option value="${user.id}" ${task.assigneeId === user.id ? "selected" : ""}>${user.firstName} ${user.lastName} (${user.role})</option>`,
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
  assignButton?.addEventListener("click", () => assignSelectedTask(task.id));

  const finishButton =
    document.querySelector<HTMLButtonElement>("#finish-task-btn");
  finishButton?.addEventListener("click", () => finishSelectedTask(task.id));
}

function startTaskEdit(id: string): void {
  const task = taskService.getTaskById(id);
  if (!task) {
    return;
  }

  editingTaskId = id;
  taskNameInput.value = task.name;
  taskDescInput.value = task.description;
  taskPriorityInput.value = task.priority;
  taskEstimatedHoursInput.value = String(task.estimatedHours);
  renderTaskStoryOptions();
  taskStoryInput.value = task.storyId;
  taskFormTitle.textContent = "Edytuj zadanie";
  taskSubmitBtn.textContent = "Zapisz zmiany";
  taskCancelBtn.classList.remove("hidden");
  taskNameInput.focus();
}

function cancelTaskEdit(): void {
  editingTaskId = null;
  taskForm.reset();
  taskPriorityInput.value = "sredni";
  taskEstimatedHoursInput.value = "1";
  taskFormTitle.textContent = "Nowe zadanie";
  taskSubmitBtn.textContent = "Dodaj zadanie";
  taskCancelBtn.classList.add("hidden");
  renderTaskStoryOptions();
}

function deleteTask(id: string): void {
  if (!confirm("Czy na pewno chcesz usunac to zadanie?")) {
    return;
  }

  const task = taskService.getTaskById(id);
  taskService.deleteTask(id);

  if (editingTaskId === id) {
    cancelTaskEdit();
  }

  if (selectedTaskId === id) {
    selectedTaskId = null;
  }

  if (task) {
    const storyTasks = taskService.getTasksByStory(task.storyId);
    if (
      storyTasks.length > 0 &&
      storyTasks.every((storyTask) => storyTask.status === "done")
    ) {
      storyService.updateStoryStatus(task.storyId, "done");
    }
  }

  renderStories();
  renderTasks();
  renderTaskDetails();
}

function assignSelectedTask(taskId: string): void {
  const assigneeSelect =
    document.querySelector<HTMLSelectElement>("#details-assignee");
  const assigneeId = assigneeSelect?.value ?? "";

  if (!assigneeId) {
    alert("Wybierz osobe do przypisania.");
    return;
  }

  const assignee = userService.getUserById(assigneeId);
  if (
    !assignee ||
    (assignee.role !== "developer" && assignee.role !== "devops")
  ) {
    alert("Zadanie moze byc przypisane tylko do developer lub devops.");
    return;
  }

  const task = taskService.assignTask(taskId, assigneeId);
  if (!task) {
    alert("Nie udalo sie przypisac zadania.");
    return;
  }

  const story = storyService.getStoryById(task.storyId);
  if (story && story.status === "todo") {
    storyService.updateStoryStatus(story.id, "doing");
  }

  renderStories();
  renderTasks();
  renderTaskDetails();
}

function finishSelectedTask(taskId: string): void {
  const task = taskService.getTaskById(taskId);
  if (!task) {
    return;
  }

  if (!task.assigneeId) {
    alert("Najpierw przypisz osobe do zadania.");
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

  const updatedTask = taskService.markTaskDone(task.id, safeWorkedHours);
  if (!updatedTask) {
    alert("Nie udalo sie zamknac zadania.");
    return;
  }

  const storyTasks = taskService.getTasksByStory(task.storyId);
  if (
    storyTasks.length > 0 &&
    storyTasks.every((storyTask) => storyTask.status === "done")
  ) {
    storyService.updateStoryStatus(task.storyId, "done");
  }

  renderStories();
  renderTasks();
  renderTaskDetails();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = projectNameInput.value.trim();
  const description = projectDescInput.value.trim();
  if (!name) {
    return;
  }

  if (editingProjectId) {
    projectService.updateProject(editingProjectId, name, description);
    cancelProjectEdit();
  } else {
    const created = projectService.createProject(name, description);
    projectForm.reset();

    if (!getActiveProjectId()) {
      activeProjectService.setActiveProjectId(created.id);
    }
  }

  renderProjects();
  renderStories();
  renderTaskStoryOptions();
  renderTasks();
  renderTaskDetails();
});

storyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const activeProject = getActiveProject();
  if (!activeProject) {
    return;
  }

  const name = storyNameInput.value.trim();
  const description = storyDescInput.value.trim();
  const priority = storyPriorityInput.value as StoryPriority;
  const status = storyStatusInput.value as StoryStatus;

  if (!name) {
    return;
  }

  if (editingStoryId) {
    storyService.updateStory(editingStoryId, {
      name,
      description,
      priority,
      status,
      ownerId: loggedInUser.id,
    });
    cancelStoryEdit();
  } else {
    storyService.createStory({
      name,
      description,
      priority,
      status,
      projectId: activeProject.id,
      ownerId: loggedInUser.id,
    });
    cancelStoryEdit();
  }

  renderStories();
  renderTaskStoryOptions();
  renderTasks();
  renderTaskDetails();
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const activeProject = getActiveProject();
  if (!activeProject) {
    return;
  }

  const name = taskNameInput.value.trim();
  const description = taskDescInput.value.trim();
  const priority = taskPriorityInput.value as StoryPriority;
  const storyId = taskStoryInput.value;
  const estimatedHours = Number.parseInt(taskEstimatedHoursInput.value, 10);

  if (
    !name ||
    !storyId ||
    !Number.isFinite(estimatedHours) ||
    estimatedHours <= 0
  ) {
    return;
  }

  if (editingTaskId) {
    const existing = taskService.getTaskById(editingTaskId);
    if (!existing) {
      return;
    }

    taskService.updateTask(editingTaskId, {
      name,
      description,
      priority,
      storyId,
      projectId: activeProject.id,
      estimatedHours,
      workedHours: existing.workedHours,
    });
    cancelTaskEdit();
  } else {
    const created = taskService.createTask({
      name,
      description,
      priority,
      storyId,
      projectId: activeProject.id,
      estimatedHours,
    });
    selectedTaskId = created.id;
    cancelTaskEdit();
  }

  renderTasks();
  renderTaskDetails();
});

projectCancelBtn.addEventListener("click", cancelProjectEdit);
storyCancelBtn.addEventListener("click", cancelStoryEdit);
taskCancelBtn.addEventListener("click", cancelTaskEdit);

loggedUserName.textContent = `${loggedInUser.firstName} ${loggedInUser.lastName} (${loggedInUser.role})`;

initThemeToggle();
renderProjects();
renderStories();
renderTaskStoryOptions();
renderTasks();
renderTaskDetails();
