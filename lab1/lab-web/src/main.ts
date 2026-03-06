import "./style.css";
import type { Story, StoryPriority, StoryStatus } from "./models/Story";
import { ProjectService } from "./services/ProjectService";
import { StoryService } from "./services/StoryService";
import { UserService } from "./services/UserService";
import type { Project } from "./models/Project";
import { ActiveProjectService } from "./services/ActiveProjectService";

const projectService = new ProjectService();
const storyService = new StoryService();
const userService = new UserService();
const activeProjectService = new ActiveProjectService();

const loggedInUser = userService.getLoggedInUser();

let editingProjectId: string | null = null;
let editingStoryId: string | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="container">
    <header>
      <h1>ManageMe</h1>
      <p class="subtitle">Zarządzaj projektami i historyjkami</p>
      <p class="logged-user">Zalogowany: <strong id="logged-user-name"></strong></p>
    </header>

    <section class="form-section">
      <h2 id="project-form-title">Nowy projekt</h2>
      <form id="project-form">
        <div class="form-group">
          <label for="project-name">Nazwa projektu</label>
          <input type="text" id="project-name" placeholder="Wpisz nazwę..." required />
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

function setActiveProject(projectId: string): void {
  activeProjectService.setActiveProjectId(projectId);
  cancelStoryEdit();
  renderProjects();
  renderStories();
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
        <p>Brak projektów. Dodaj pierwszy projekt!</p>
      </div>
    `;
    return;
  }

  projectList.innerHTML = projects
    .map(
      (p: Project) => `
      <div class="project-card ${activeProjectId === p.id ? "active" : ""}" data-id="${p.id}">
        <div class="project-info">
          <h3 class="project-name">${escapeHtml(p.name)}</h3>
          <p class="project-desc">${escapeHtml(p.description) || "<em>Brak opisu</em>"}</p>
          <span class="project-id">ID: ${p.id}</span>
        </div>
        <div class="project-actions">
          <button class="btn btn-select" data-id="${p.id}">${activeProjectId === p.id ? "Aktywny" : "Ustaw aktywny"}</button>
          <button class="btn btn-edit" data-id="${p.id}">Edytuj</button>
          <button class="btn btn-delete" data-id="${p.id}">Usuń</button>
        </div>
      </div>
    `,
    )
    .join("");

  projectList.querySelectorAll(".btn-select").forEach((btn) => {
    btn.addEventListener("click", () =>
      setActiveProject((btn as HTMLElement).dataset.id!),
    );
  });
  projectList.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () =>
      startProjectEdit((btn as HTMLElement).dataset.id!),
    );
  });
  projectList.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () =>
      deleteProject((btn as HTMLElement).dataset.id!),
    );
  });
}

function startProjectEdit(id: string): void {
  const project = projectService.getProjectById(id);
  if (!project) return;

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
  if (!confirm("Czy na pewno chcesz usunąć ten projekt?")) return;

  projectService.deleteProject(id);
  storyService.deleteStoriesByProject(id);

  if (editingProjectId === id) {
    cancelProjectEdit();
  }

  if (getActiveProjectId() === id) {
    const remaining = projectService.getProjects();
    if (remaining[0]) {
      activeProjectService.setActiveProjectId(remaining[0].id);
    } else {
      activeProjectService.clearActiveProjectId();
    }
    cancelStoryEdit();
  }

  renderProjects();
  renderStories();
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
      const inGroup = stories.filter((story) => story.status === status);
      return `
        <div class="story-column">
          <h3>${title} <span class="badge">${inGroup.length}</span></h3>
          <div class="story-list">
            ${
              inGroup.length === 0
                ? '<p class="column-empty">Brak historyjek</p>'
                : inGroup.map((story) => renderStoryCard(story)).join("")
            }
          </div>
        </div>
      `;
    })
    .join("");

  storyBoard.querySelectorAll(".btn-story-edit").forEach((btn) => {
    btn.addEventListener("click", () =>
      startStoryEdit((btn as HTMLElement).dataset.id!),
    );
  });
  storyBoard.querySelectorAll(".btn-story-delete").forEach((btn) => {
    btn.addEventListener("click", () =>
      deleteStory((btn as HTMLElement).dataset.id!),
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
  if (editingStoryId === id) {
    cancelStoryEdit();
  }

  renderStories();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

projectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = projectNameInput.value.trim();
  const description = projectDescInput.value.trim();

  if (!name) return;

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
});

storyForm.addEventListener("submit", (e) => {
  e.preventDefault();

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
});

projectCancelBtn.addEventListener("click", cancelProjectEdit);
storyCancelBtn.addEventListener("click", cancelStoryEdit);

loggedUserName.textContent = `${loggedInUser.firstName} ${loggedInUser.lastName}`;

renderProjects();
renderStories();
