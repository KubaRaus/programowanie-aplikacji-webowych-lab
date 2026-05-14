import type { Notification } from "../models/Notification";
import type { Project } from "../models/Project";
import type { Story, StoryPriority, StoryStatus } from "../models/Story";
import type { Task, TaskStatus } from "../models/Task";
import type { User, UserRole } from "../models/User";
import { APP_CONFIG } from "../config";
import { ActiveProjectService } from "../services/ActiveProjectService";
import { NotificationService } from "../services/NotificationService";
import { ProjectService } from "../services/ProjectService";
import { StoryService } from "../services/StoryService";
import { appStorage } from "../services/storage/AppStorage";
import { TaskService } from "../services/TaskService";
import { UserService } from "../services/UserService";
import { BoardWorkflowService } from "../use-cases/BoardWorkflowService";
import { TaskWorkflowService } from "../use-cases/TaskWorkflowService";
import { renderAppLayout } from "./ViewRenderer";

export async function startApp(): Promise<void> {
const projectService = new ProjectService();
const storyService = new StoryService();
const taskService = new TaskService();
const userService = new UserService();
const activeProjectService = new ActiveProjectService();
const notificationService = new NotificationService();
const boardWorkflowService = new BoardWorkflowService(
  projectService,
  storyService,
  taskService,
  activeProjectService,
);
const taskWorkflowService = new TaskWorkflowService(
  taskService,
  storyService,
  userService,
);
await appStorage.initialize();

let loggedInUser: User | null = userService.getLoggedInUser();

let editingProjectId: string | null = null;
let editingStoryId: string | null = null;
let editingTaskId: string | null = null;
let selectedTaskId: string | null = null;
let selectedNotificationId: string | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;
renderAppLayout(app, APP_CONFIG.superAdminEmail, escapeHtml);

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
const storyOwnerInput =
  document.querySelector<HTMLSelectElement>("#story-owner")!;
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
const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn")!;
const loginView = document.querySelector<HTMLElement>("#login-view")!;
const blockedView = document.querySelector<HTMLElement>("#blocked-view")!;
const blockedLogoutBtn = document.querySelector<HTMLButtonElement>(
  "#blocked-logout-btn",
)!;
const loginError = document.querySelector<HTMLParagraphElement>("#login-error")!;
const googleLoginButton = document.querySelector<HTMLDivElement>(
  "#google-login-button",
)!;
const appShell = document.querySelector<HTMLElement>("#app-shell")!;
const guestPendingView = document.querySelector<HTMLElement>("#guest-pending-view")!;
const boardView = document.querySelector<HTMLElement>("#board-view")!;
const notificationsView =
  document.querySelector<HTMLElement>("#notifications-view")!;
const notificationDetailsView = document.querySelector<HTMLElement>(
  "#notification-details-view",
)!;
const usersView = document.querySelector<HTMLElement>("#users-view")!;
const notificationsList = document.querySelector<HTMLDivElement>(
  "#notifications-list",
)!;
const notificationDetails = document.querySelector<HTMLDivElement>(
  "#notification-details",
)!;
const menuBoardBtn = document.querySelector<HTMLButtonElement>("#menu-board-btn")!;
const menuNotificationsBtn = document.querySelector<HTMLButtonElement>(
  "#menu-notifications-btn",
)!;
const menuUsersBtn = document.querySelector<HTMLButtonElement>("#menu-users-btn")!;
const notificationsBackBtn = document.querySelector<HTMLButtonElement>(
  "#notifications-back-btn",
)!;
const notificationDetailsBackBtn = document.querySelector<HTMLButtonElement>(
  "#notification-details-back-btn",
)!;
const unreadCounterBtn = document.querySelector<HTMLButtonElement>(
  "#unread-counter-btn",
)!;
const unreadCounterValue = document.querySelector<HTMLSpanElement>(
  "#unread-counter-value",
)!;
const notificationModalBackdrop = document.querySelector<HTMLDivElement>(
  "#notification-modal-backdrop",
)!;
const notificationModalTitle = document.querySelector<HTMLHeadingElement>(
  "#notification-modal-title",
)!;
const notificationModalMessage = document.querySelector<HTMLParagraphElement>(
  "#notification-modal-message",
)!;
const notificationModalPriority = document.querySelector<HTMLSpanElement>(
  "#notification-modal-priority",
)!;
const notificationModalDate = document.querySelector<HTMLSpanElement>(
  "#notification-modal-date",
)!;
const notificationModalOpenBtn = document.querySelector<HTMLButtonElement>(
  "#notification-modal-open-btn",
)!;
const notificationModalCloseBtn = document.querySelector<HTMLButtonElement>(
  "#notification-modal-close-btn",
)!;
const usersList = document.querySelector<HTMLDivElement>("#users-list")!;

const THEME_STORAGE_KEY = "manageme-theme";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
type Theme = "light" | "dark";
let activeModalNotificationId: string | null = null;
let googleLoginInitRetries = 0;

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

function requireLoggedInUser(): User {
  if (!loggedInUser) {
    throw new Error("Brak zalogowanego uzytkownika.");
  }
  return loggedInUser;
}

function getAssignableUsers(): User[] {
  return userService.getAssignableUsers();
}

function getStoryOwnerCandidates(): User[] {
  return userService.getUsers().filter((user) => !user.isBlocked);
}

function getAdminUsers(): User[] {
  return userService.getAdminUsers().filter((user) => !user.isBlocked);
}

function renderStoryOwnerOptions(selectedOwnerId?: string): void {
  const users = getStoryOwnerCandidates();
  if (users.length === 0) {
    storyOwnerInput.innerHTML =
      '<option value="">Brak aktywnych uzytkownikow</option>';
    storyOwnerInput.disabled = true;
    return;
  }

  storyOwnerInput.disabled = false;
  storyOwnerInput.innerHTML = users
    .map(
      (user) =>
        `<option value="${user.id}">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)} (${getRoleLabel(user.role)})</option>`,
    )
    .join("");

  const fallbackOwnerId = requireLoggedInUser().id;
  const preferredOwnerId =
    selectedOwnerId && users.some((user) => user.id === selectedOwnerId)
      ? selectedOwnerId
      : fallbackOwnerId;

  if (users.some((user) => user.id === preferredOwnerId)) {
    storyOwnerInput.value = preferredOwnerId;
  } else {
    storyOwnerInput.value = users[0].id;
  }
}

function getRoleLabel(role: UserRole): string {
  if (role === "admin") {
    return "Admin";
  }
  if (role === "developer") {
    return "Developer";
  }
  if (role === "devops") {
    return "DevOps";
  }
  return "Gosc";
}

function parseJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);
  return JSON.parse(decoded) as Record<string, unknown>;
}

function validateGooglePayload(payload: Record<string, unknown>): void {
  const audience = String(payload.aud ?? "");
  if (!audience || audience !== GOOGLE_CLIENT_ID) {
    throw new Error("Nieprawidlowe audience tokena Google.");
  }

  const issuer = String(payload.iss ?? "");
  const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
  if (!validIssuers.includes(issuer)) {
    throw new Error("Nieprawidlowy issuer tokena Google.");
  }

  const expiration = Number(payload.exp ?? 0);
  if (!Number.isFinite(expiration) || expiration <= Date.now() / 1000) {
    throw new Error("Token Google wygasl.");
  }
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const normalized = fullName.trim();
  if (!normalized) {
    return { firstName: "Uzytkownik", lastName: "Google" };
  }
  const parts = normalized.split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || "Google",
  };
}

async function ensureStorageSynced(): Promise<boolean> {
  try {
    await appStorage.waitForIdle();
    return true;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nie udalo sie zapisac danych w bazie.";
    alert(`Zapis danych nie powiodl sie: ${message}`);
    return false;
  }
}

function setLoginError(message: string | null): void {
  if (!message) {
    loginError.textContent = "";
    loginError.classList.add("hidden");
    return;
  }
  loginError.textContent = message;
  loginError.classList.remove("hidden");
}

function syncLoggedUserName(): void {
  const user = requireLoggedInUser();
  loggedUserName.textContent = `${user.firstName} ${user.lastName} (${getRoleLabel(user.role)})`;
}

function sendNewAccountNotification(newUser: User): void {
  const adminRecipientIds = getAdminUsers()
    .filter((admin) => admin.id !== newUser.id)
    .map((admin) => admin.id);
  if (adminRecipientIds.length === 0) {
    return;
  }
  sendNotification({
    title: "Nowe konto w systemie",
    message: `Utworzono konto: ${newUser.firstName} ${newUser.lastName} (${newUser.email}).`,
    priority: "high",
    recipientIds: adminRecipientIds,
  });
}

function applyAccessMode(): void {
  const user = requireLoggedInUser();
  const isAdmin = user.role === "admin";
  const isGuest = user.role === "guest";

  loginView.classList.add("hidden");
  blockedView.classList.add("hidden");
  appShell.classList.remove("hidden");
  menuUsersBtn.classList.toggle("hidden", !isAdmin);
  menuBoardBtn.classList.toggle("hidden", isGuest);
  menuNotificationsBtn.classList.toggle("hidden", isGuest);
  unreadCounterBtn.classList.toggle("hidden", isGuest);
  guestPendingView.classList.toggle("hidden", !isGuest);
  boardView.classList.toggle("hidden", isGuest);
  notificationsView.classList.toggle("hidden", isGuest);
  notificationDetailsView.classList.toggle("hidden", true);
  usersView.classList.toggle("hidden", true);

  if (isGuest) {
    menuBoardBtn.classList.remove("active");
    menuNotificationsBtn.classList.remove("active");
    menuUsersBtn.classList.remove("active");
    return;
  }

  setActiveView("board");
}

function logoutAndShowLogin(): void {
  userService.logout();
  loggedInUser = null;
  appShell.classList.add("hidden");
  blockedView.classList.add("hidden");
  loginView.classList.remove("hidden");
  setLoginError(null);
  initGoogleLogin();
}

async function handleGoogleCredential(
  response: GoogleCredentialResponse,
): Promise<void> {
  try {
    const payload = parseJwtPayload(response.credential);
    validateGooglePayload(payload);
    const email = String(payload.email ?? "").trim().toLowerCase();
    if (!email) {
      throw new Error("Brak emaila w odpowiedzi dostawcy OAuth.");
    }
    const payloadName = String(payload.name ?? "");
    const names = splitName(payloadName);
    const firstName = String(payload.given_name ?? names.firstName);
    const lastName = String(payload.family_name ?? names.lastName);
    const result = userService.loginWithOAuthProfile(
      { email, firstName, lastName },
      APP_CONFIG.superAdminEmail,
    );
    if (!(await ensureStorageSynced())) {
      return;
    }
    loggedInUser = result.user;
    if (result.isNewUser) {
      sendNewAccountNotification(result.user);
    }
    if (result.user.isBlocked) {
      appShell.classList.add("hidden");
      loginView.classList.add("hidden");
      blockedView.classList.remove("hidden");
      return;
    }
    syncLoggedUserName();
    applyAccessMode();
    updateUnreadCounter();
    renderNotifications();
    renderNotificationDetails();
    renderUsers();
    renderStoryOwnerOptions();
    setLoginError(null);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nie udalo sie zalogowac.";
    setLoginError(message);
  }
}

function initGoogleLogin(): void {
  if (!GOOGLE_CLIENT_ID) {
    setLoginError(
      "Brak VITE_GOOGLE_CLIENT_ID w konfiguracji. Dodaj zmienna srodowiskowa.",
    );
    return;
  }

  if (!window.google?.accounts?.id) {
    if (googleLoginInitRetries < 8) {
      googleLoginInitRetries += 1;
      setTimeout(initGoogleLogin, 300);
      return;
    }
    setLoginError("Nie mozna zaladowac biblioteki Google OAuth.");
    return;
  }

  googleLoginInitRetries = 0;
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      void handleGoogleCredential(response);
    },
  });
  googleLoginButton.innerHTML = "";
  window.google.accounts.id.renderButton(googleLoginButton, {
    type: "standard",
    size: "large",
    text: "signin_with",
    shape: "pill",
    width: 260,
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

function formatNotificationPriority(priority: Notification["priority"]): string {
  if (priority === "high") {
    return "Wysoki";
  }
  if (priority === "medium") {
    return "Sredni";
  }
  return "Niski";
}

function getMyNotifications(): Notification[] {
  return notificationService.getNotificationsByRecipient(requireLoggedInUser().id);
}

function updateUnreadCounter(): void {
  unreadCounterValue.textContent = String(
    notificationService.getUnreadCountByRecipient(requireLoggedInUser().id),
  );
}

async function markNotificationAsRead(notificationId: string): Promise<void> {
  notificationService.markAsRead(notificationId);
  if (!(await ensureStorageSynced())) {
    return;
  }
  updateUnreadCounter();
  renderNotifications();
  renderNotificationDetails();
}

async function openNotificationDetails(notificationId: string): Promise<void> {
  selectedNotificationId = notificationId;
  notificationService.markAsRead(notificationId);
  if (!(await ensureStorageSynced())) {
    return;
  }
  updateUnreadCounter();
  setActiveView("notification-details");
  renderNotifications();
  renderNotificationDetails();
}

function renderNotifications(): void {
  const notifications = getMyNotifications();
  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔔</span>
        <p>Brak powiadomien.</p>
      </div>
    `;
    return;
  }

  notificationsList.innerHTML = notifications
    .map(
      (notification) => `
      <article class="notification-card ${notification.isRead ? "notification-read" : "notification-unread"}">
        <h3>${escapeHtml(notification.title)}</h3>
        <p>${escapeHtml(notification.message)}</p>
        <div class="notification-meta">
          <span>Priorytet: ${formatNotificationPriority(notification.priority)}</span>
          <span>Data: ${formatDate(notification.date)}</span>
        </div>
        <div class="story-actions">
          <button type="button" class="btn btn-select btn-notification-details" data-id="${notification.id}">Szczegoly</button>
          ${
            notification.isRead
              ? ""
              : `<button type="button" class="btn btn-primary btn-notification-read" data-id="${notification.id}">Oznacz jako przeczytane</button>`
          }
        </div>
      </article>
    `,
    )
    .join("");

  notificationsList
    .querySelectorAll(".btn-notification-details")
    .forEach((button) => {
      button.addEventListener("click", () =>
        void openNotificationDetails((button as HTMLElement).dataset.id!),
      );
    });

  notificationsList.querySelectorAll(".btn-notification-read").forEach((button) => {
    button.addEventListener("click", () =>
      void markNotificationAsRead((button as HTMLElement).dataset.id!),
    );
  });
}

function renderNotificationDetails(): void {
  const notification = selectedNotificationId
    ? notificationService.getNotificationById(selectedNotificationId)
    : null;

  if (!notification || notification.recipientId !== requireLoggedInUser().id) {
    notificationDetails.innerHTML = `
      <h3>Szczegoly powiadomienia</h3>
      <p class="column-empty">Wybierz powiadomienie z listy.</p>
    `;
    return;
  }

  notificationDetails.innerHTML = `
    <h3>${escapeHtml(notification.title)}</h3>
    <div class="details-grid">
      <p><strong>Priorytet:</strong> ${formatNotificationPriority(notification.priority)}</p>
      <p><strong>Data:</strong> ${formatDate(notification.date)}</p>
      <p><strong>Status:</strong> ${notification.isRead ? "Przeczytane" : "Nieprzeczytane"}</p>
    </div>
    <p>${escapeHtml(notification.message)}</p>
    ${
      notification.isRead
        ? ""
        : `<div class="form-actions"><button type="button" id="notification-detail-read-btn" class="btn btn-primary">Oznacz jako przeczytane</button></div>`
    }
  `;

  const detailReadBtn = document.querySelector<HTMLButtonElement>(
    "#notification-detail-read-btn",
  );
  detailReadBtn?.addEventListener("click", () =>
    void markNotificationAsRead(notification.id),
  );
}

function renderUsers(): void {
  const currentUser = requireLoggedInUser();
  if (currentUser.role !== "admin") {
    usersList.innerHTML = `
      <p class="column-empty">Dostep tylko dla administratorow.</p>
    `;
    return;
  }

  const users = userService.getUsers();
  if (users.length === 0) {
    usersList.innerHTML = `
      <p class="column-empty">Brak uzytkownikow.</p>
    `;
    return;
  }

  usersList.innerHTML = users
    .map(
      (user) => `
      <article class="user-card ${user.isBlocked ? "user-card-blocked" : ""}">
        <div>
          <h3>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</h3>
          <p>${escapeHtml(user.email)}</p>
        </div>
        <div class="user-actions">
          <label>
            Rola
            <select class="user-role-select" data-id="${user.id}" ${user.id === currentUser.id ? "disabled" : ""}>
              <option value="guest" ${user.role === "guest" ? "selected" : ""}>Gosc</option>
              <option value="developer" ${user.role === "developer" ? "selected" : ""}>Developer</option>
              <option value="devops" ${user.role === "devops" ? "selected" : ""}>DevOps</option>
              <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </label>
          <button type="button" class="btn ${user.isBlocked ? "btn-select" : "btn-delete"} btn-user-block" data-id="${user.id}" ${user.id === currentUser.id ? "disabled" : ""}>
            ${user.isBlocked ? "Odblokuj" : "Zablokuj"}
          </button>
        </div>
      </article>
    `,
    )
    .join("");

  usersList.querySelectorAll(".user-role-select").forEach((element) => {
    element.addEventListener("change", async () => {
      const select = element as HTMLSelectElement;
      const userId = select.dataset.id ?? "";
      const role = select.value as UserRole;
      const updated = userService.updateUserRole(userId, role);
      if (!updated) {
        return;
      }
      if (!(await ensureStorageSynced())) {
        renderUsers();
        return;
      }
      if (loggedInUser && loggedInUser.id === updated.id) {
        loggedInUser = updated;
      }
      renderUsers();
      renderStoryOwnerOptions(storyOwnerInput.value);
      syncLoggedUserName();
      applyAccessMode();
    });
  });

  usersList.querySelectorAll(".btn-user-block").forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = (button as HTMLElement).dataset.id ?? "";
      const target = userService.getUserById(userId);
      if (!target) {
        return;
      }
      const updated = userService.setUserBlocked(userId, !target.isBlocked);
      if (!updated) {
        return;
      }
      if (!(await ensureStorageSynced())) {
        renderUsers();
        return;
      }
      if (loggedInUser && loggedInUser.id === updated.id) {
        loggedInUser = updated;
      }
      renderUsers();
      renderStoryOwnerOptions(storyOwnerInput.value);
      applyAccessMode();
    });
  });
}

function showNotificationModal(notification: Notification): void {
  activeModalNotificationId = notification.id;
  notificationModalTitle.textContent = notification.title;
  notificationModalMessage.textContent = notification.message;
  notificationModalPriority.textContent = `Priorytet: ${formatNotificationPriority(
    notification.priority,
  )}`;
  notificationModalDate.textContent = formatDate(notification.date);
  notificationModalBackdrop.classList.remove("hidden");
}

function closeNotificationModal(): void {
  activeModalNotificationId = null;
  notificationModalBackdrop.classList.add("hidden");
}

function sendNotification(input: {
  title: string;
  message: string;
  priority: Notification["priority"];
  recipientIds: string[];
}): void {
  const recipientIds = [...new Set(input.recipientIds)];
  if (recipientIds.length === 0) {
    return;
  }

  const created = notificationService.createNotificationsForRecipients({
    title: input.title,
    message: input.message,
    priority: input.priority,
    recipientIds,
  });

  const modalNotification = created.find(
    (notification) =>
      notification.recipientId === requireLoggedInUser().id &&
      (notification.priority === "medium" || notification.priority === "high"),
  );

  if (modalNotification) {
    showNotificationModal(modalNotification);
  }

  updateUnreadCounter();
  renderNotifications();
  renderNotificationDetails();
}

function setActiveView(
  view: "board" | "notifications" | "notification-details" | "users",
): void {
  if (requireLoggedInUser().role === "guest") {
    guestPendingView.classList.remove("hidden");
    boardView.classList.add("hidden");
    notificationsView.classList.add("hidden");
    notificationDetailsView.classList.add("hidden");
    usersView.classList.add("hidden");
    return;
  }

  boardView.classList.toggle("hidden", view !== "board");
  notificationsView.classList.toggle("hidden", view !== "notifications");
  notificationDetailsView.classList.toggle(
    "hidden",
    view !== "notification-details",
  );
  usersView.classList.toggle("hidden", view !== "users");
  guestPendingView.classList.add("hidden");
  menuBoardBtn.classList.toggle("active", view === "board");
  menuNotificationsBtn.classList.toggle(
    "active",
    view === "notifications" || view === "notification-details",
  );
  menuUsersBtn.classList.toggle("active", view === "users");
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
      void deleteProject((button as HTMLElement).dataset.id!),
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

async function deleteProject(id: string): Promise<void> {
  if (!confirm("Czy na pewno chcesz usunac ten projekt?")) {
    return;
  }

  const result = boardWorkflowService.deleteProject(id);
  if (!result.ok) {
    alert(result.error ?? "Nie udalo sie usunac projektu.");
    return;
  }
  result.notifications.forEach((notification) => sendNotification(notification));
  if (!(await ensureStorageSynced())) {
    return;
  }

  if (editingProjectId === id) {
    cancelProjectEdit();
  }

  selectedTaskId = result.clearedSelectedTask ? null : selectedTaskId;
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
      void deleteStory((button as HTMLElement).dataset.id!),
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
  renderStoryOwnerOptions(story.ownerId);
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
  renderStoryOwnerOptions();
  storyFormTitle.textContent = "Nowa historyjka";
  storySubmitBtn.textContent = "Dodaj historyjke";
  storyCancelBtn.classList.add("hidden");
}

async function deleteStory(id: string): Promise<void> {
  if (!confirm("Czy na pewno chcesz usunac te historyjke?")) {
    return;
  }

  const result = boardWorkflowService.deleteStory(id, selectedTaskId);
  if (!result.ok) {
    alert(result.error ?? "Nie udalo sie usunac historyjki.");
    return;
  }
  result.notifications.forEach((notification) => sendNotification(notification));
  if (!(await ensureStorageSynced())) {
    return;
  }

  if (editingStoryId === id) {
    cancelStoryEdit();
  }

  if (result.clearedSelectedTask) {
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
      void deleteTask((button as HTMLElement).dataset.id!),
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
          ${getAssignableUsers()
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
  assignButton?.addEventListener("click", () => void assignSelectedTask(task.id));

  const finishButton =
    document.querySelector<HTMLButtonElement>("#finish-task-btn");
  finishButton?.addEventListener("click", () => void finishSelectedTask(task.id));
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

async function deleteTask(id: string): Promise<void> {
  if (!confirm("Czy na pewno chcesz usunac to zadanie?")) {
    return;
  }

  const result = taskWorkflowService.deleteTask(id);
  if (!result.ok) {
    if (result.error) {
      alert(result.error);
    }
    return;
  }

  result.notifications.forEach((notification) => sendNotification(notification));
  if (!(await ensureStorageSynced())) {
    return;
  }

  if (editingTaskId === id) {
    cancelTaskEdit();
  }

  if (selectedTaskId === id) {
    selectedTaskId = null;
  }

  renderStories();
  renderTasks();
  renderTaskDetails();
}

async function assignSelectedTask(taskId: string): Promise<void> {
  const assigneeSelect =
    document.querySelector<HTMLSelectElement>("#details-assignee");
  const assigneeId = assigneeSelect?.value ?? "";

  if (!assigneeId) {
    alert("Wybierz osobe do przypisania.");
    return;
  }

  const result = taskWorkflowService.assignTask(taskId, assigneeId);
  if (!result.ok) {
    alert(result.error ?? "Nie udalo sie przypisac zadania.");
    return;
  }

  result.notifications.forEach((notification) => sendNotification(notification));
  if (!(await ensureStorageSynced())) {
    return;
  }

  renderStories();
  renderTasks();
  renderTaskDetails();
}

async function finishSelectedTask(taskId: string): Promise<void> {
  const task = taskService.getTaskById(taskId);
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

  const result = taskWorkflowService.finishTask(task.id, safeWorkedHours);
  if (!result.ok) {
    alert(result.error ?? "Nie udalo sie zamknac zadania.");
    return;
  }

  result.notifications.forEach((notification) => sendNotification(notification));
  if (!(await ensureStorageSynced())) {
    return;
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

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = projectNameInput.value.trim();
  const description = projectDescInput.value.trim();
  if (!name) {
    return;
  }

  const result = boardWorkflowService.upsertProject({
    editingProjectId,
    name,
    description,
    adminRecipientIds: getAdminUsers().map((user) => user.id),
  });

  if (!result.ok) {
    alert(result.error ?? "Nie udalo sie zapisac projektu.");
    return;
  }
  result.notifications.forEach((notification) => sendNotification(notification));
  if (!(await ensureStorageSynced())) {
    return;
  }

  if (editingProjectId) {
    cancelProjectEdit();
  } else {
    projectForm.reset();
  }

  renderProjects();
  renderStories();
  renderTaskStoryOptions();
  renderTasks();
  renderTaskDetails();
});

storyForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activeProject = getActiveProject();
  if (!activeProject) {
    return;
  }

  const name = storyNameInput.value.trim();
  const description = storyDescInput.value.trim();
  const priority = storyPriorityInput.value as StoryPriority;
  const status = storyStatusInput.value as StoryStatus;
  const ownerId = storyOwnerInput.value || requireLoggedInUser().id;

  if (!name) {
    return;
  }

  const result = boardWorkflowService.upsertStory({
    editingStoryId,
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
  result.notifications.forEach((notification) => sendNotification(notification));
  if (!(await ensureStorageSynced())) {
    return;
  }

  cancelStoryEdit();

  renderStories();
  renderTaskStoryOptions();
  renderTasks();
  renderTaskDetails();
});

taskForm.addEventListener("submit", async (event) => {
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

  const result = boardWorkflowService.upsertTask({
    editingTaskId,
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
  result.notifications.forEach((notification) => sendNotification(notification));
  if (!(await ensureStorageSynced())) {
    return;
  }

  if (editingTaskId) {
    cancelTaskEdit();
  } else {
    selectedTaskId = result.selectedTaskId;
    cancelTaskEdit();
  }

  renderTasks();
  renderTaskDetails();
});

projectCancelBtn.addEventListener("click", cancelProjectEdit);
storyCancelBtn.addEventListener("click", cancelStoryEdit);
taskCancelBtn.addEventListener("click", cancelTaskEdit);
menuBoardBtn.addEventListener("click", () => setActiveView("board"));
menuNotificationsBtn.addEventListener("click", () => {
  renderNotifications();
  setActiveView("notifications");
});
menuUsersBtn.addEventListener("click", () => {
  renderUsers();
  setActiveView("users");
});
notificationsBackBtn.addEventListener("click", () => setActiveView("board"));
notificationDetailsBackBtn.addEventListener("click", () =>
  setActiveView("notifications"),
);
unreadCounterBtn.addEventListener("click", () => {
  renderNotifications();
  setActiveView("notifications");
});
notificationModalCloseBtn.addEventListener("click", closeNotificationModal);
notificationModalBackdrop.addEventListener("click", (event) => {
  if (event.target === notificationModalBackdrop) {
    closeNotificationModal();
  }
});
notificationModalOpenBtn.addEventListener("click", () => {
  if (!activeModalNotificationId) {
    return;
  }
  const notificationId = activeModalNotificationId;
  closeNotificationModal();
  void openNotificationDetails(notificationId);
});
logoutBtn.addEventListener("click", logoutAndShowLogin);
blockedLogoutBtn.addEventListener("click", logoutAndShowLogin);

initThemeToggle();
if (!loggedInUser) {
  appShell.classList.add("hidden");
  blockedView.classList.add("hidden");
  loginView.classList.remove("hidden");
  initGoogleLogin();
} else if (loggedInUser.isBlocked) {
  appShell.classList.add("hidden");
  loginView.classList.add("hidden");
  blockedView.classList.remove("hidden");
} else {
  syncLoggedUserName();
  renderStoryOwnerOptions();
  renderProjects();
  renderStories();
  renderTaskStoryOptions();
  renderTasks();
  renderTaskDetails();
  renderNotifications();
  renderNotificationDetails();
  updateUnreadCounter();
  renderUsers();
  applyAccessMode();
}
}
