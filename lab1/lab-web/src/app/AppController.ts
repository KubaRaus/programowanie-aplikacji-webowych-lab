import type { Notification } from "../models/Notification";
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
import { createAppAuthController } from "./AppAuthController";
import { createAppBoardActionsController } from "./AppBoardActionsController";
import { createAppBoardPanels } from "./AppBoardPanels";
import { bindAppEvents } from "./AppEventBindings";
import { createAppDom } from "./AppDom";
import { createAppThemeController } from "./AppThemeController";
import { createNotificationModalController } from "./NotificationModalController";
import { createAppSidePanels } from "./AppSidePanels";
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

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Brak kontenera aplikacji #app");
}
renderAppLayout(app, APP_CONFIG.superAdminEmail, escapeHtml);
const appDom = createAppDom();
const {
  loggedUserName,
  projectForm,
  projectNameInput,
  projectDescInput,
  projectSubmitBtn,
  projectCancelBtn,
  projectFormTitle,
  projectList,
  projectCount,
  activeProjectLabel,
  storyForm,
  storyFormTitle,
  storyNameInput,
  storyDescInput,
  storyPriorityInput,
  storyStatusInput,
  storyOwnerInput,
  storySubmitBtn,
  storyCancelBtn,
  storyBoard,
  taskProjectLabel,
  taskForm,
  taskFormTitle,
  taskNameInput,
  taskDescInput,
  taskPriorityInput,
  taskStoryInput,
  taskEstimatedHoursInput,
  taskSubmitBtn,
  taskCancelBtn,
  taskBoard,
  taskDetails,
  themeToggleBtn,
  loginView,
  blockedView,
  loginError,
  googleLoginButton,
  appShell,
  guestPendingView,
  boardView,
  notificationsView,
  notificationDetailsView,
  usersView,
  notificationsList,
  notificationDetails,
  menuBoardBtn,
  menuNotificationsBtn,
  menuUsersBtn,
  unreadCounterBtn,
  unreadCounterValue,
  notificationModalBackdrop,
  notificationModalTitle,
  notificationModalMessage,
  notificationModalPriority,
  notificationModalDate,
  notificationModalOpenBtn,
  notificationModalCloseBtn,
  usersList,
} = appDom;

const THEME_STORAGE_KEY = "manageme-theme";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
const themeController = createAppThemeController({
  toggleButton: themeToggleBtn,
  storageKey: THEME_STORAGE_KEY,
});

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

async function sendNewAccountNotification(newUser: User): Promise<boolean> {
  const adminRecipientIds = getAdminUsers()
    .filter((admin) => admin.id !== newUser.id)
    .map((admin) => admin.id);
  if (adminRecipientIds.length === 0) {
    return true;
  }
  return await sendNotification({
    title: "Nowe konto w systemie",
    message: `Utworzono konto: ${newUser.firstName} ${newUser.lastName} (${newUser.email}).`,
    priority: "high",
    recipientIds: adminRecipientIds,
  });
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

const boardPanels = createAppBoardPanels({
  projectService,
  storyService,
  taskService,
  userService,
  activeProjectService,
  projectCount,
  projectList,
  activeProjectLabel,
  storyForm,
  storyBoard,
  taskProjectLabel,
  taskForm,
  taskBoard,
  taskDetails,
  taskStoryInput,
  escapeHtml,
  formatDate,
  getRoleLabel,
  getAssignableUsers,
  getSelectedTaskId: () => selectedTaskId,
  setSelectedTaskId: (value) => {
    selectedTaskId = value;
  },
  onSetActiveProject: setActiveProject,
  onStartProjectEdit: startProjectEdit,
  onDeleteProject: deleteProject,
  onStartStoryEdit: startStoryEdit,
  onDeleteStory: deleteStory,
  onStartTaskEdit: startTaskEdit,
  onDeleteTask: deleteTask,
  onAssignTask: assignSelectedTask,
  onFinishTask: finishSelectedTask,
});

function getActiveProject() {
  return boardPanels.getActiveProject();
}

let authController: ReturnType<typeof createAppAuthController>;
let boardActionsController: ReturnType<typeof createAppBoardActionsController>;

const sidePanels = createAppSidePanels({
  notificationService,
  userService,
  notificationsList,
  notificationDetails,
  unreadCounterValue,
  usersList,
  storyOwnerInput,
  getCurrentUser: requireLoggedInUser,
  getLoggedInUser: () => loggedInUser,
  setLoggedInUser: (value) => {
    loggedInUser = value;
  },
  ensureStorageSynced,
  setActiveView,
  renderStoryOwnerOptions,
  syncLoggedUserName: () => authController.syncLoggedUserName(),
  applyAccessMode: () => authController.applyAccessMode(),
  escapeHtml,
  formatDate,
  formatNotificationPriority,
});

authController = createAppAuthController({
  userService,
  googleClientId: GOOGLE_CLIENT_ID,
  superAdminEmail: APP_CONFIG.superAdminEmail,
  loginError,
  loggedUserName,
  googleLoginButton,
  loginView,
  blockedView,
  appShell,
  menuUsersBtn,
  menuBoardBtn,
  menuNotificationsBtn,
  unreadCounterBtn,
  guestPendingView,
  boardView,
  notificationsView,
  notificationDetailsView,
  usersView,
  getLoggedInUser: () => loggedInUser,
  setLoggedInUser: (value) => {
    loggedInUser = value;
  },
  getRoleLabel,
  ensureStorageSynced,
  sendNewAccountNotification,
  setActiveView,
  onActiveUserSession: () => {
    sidePanels.updateUnreadCounter();
    sidePanels.renderNotifications();
    sidePanels.renderNotificationDetails();
    sidePanels.renderUsers();
    renderStoryOwnerOptions();
  },
});

boardActionsController = createAppBoardActionsController({
  boardWorkflowService,
  taskWorkflowService,
  taskService,
  projectForm,
  projectNameInput,
  projectDescInput,
  storyForm,
  storyNameInput,
  storyDescInput,
  storyPriorityInput,
  storyStatusInput,
  storyOwnerInput,
  taskForm,
  taskNameInput,
  taskDescInput,
  taskPriorityInput,
  taskStoryInput,
  taskEstimatedHoursInput,
  getActiveProject,
  getAdminUserIds: () => getAdminUsers().map((user) => user.id),
  getRequiredLoggedInUserId: () => requireLoggedInUser().id,
  getEditingProjectId: () => editingProjectId,
  getEditingStoryId: () => editingStoryId,
  getEditingTaskId: () => editingTaskId,
  getSelectedTaskId: () => selectedTaskId,
  setSelectedTaskId: (value) => {
    selectedTaskId = value;
  },
  sendNotification,
  ensureStorageSynced,
  renderProjects,
  renderStories,
  renderTaskStoryOptions,
  renderTasks,
  renderTaskDetails,
  cancelProjectEdit,
  cancelStoryEdit,
  cancelTaskEdit,
});

const notificationModalController = createNotificationModalController({
  backdrop: notificationModalBackdrop,
  title: notificationModalTitle,
  message: notificationModalMessage,
  priority: notificationModalPriority,
  date: notificationModalDate,
  openButton: notificationModalOpenBtn,
  closeButton: notificationModalCloseBtn,
  formatDate,
  formatPriority: formatNotificationPriority,
  onOpenDetails: (notificationId) => {
    void sidePanels.openNotificationDetails(notificationId);
  },
});

async function sendNotification(input: {
  title: string;
  message: string;
  priority: Notification["priority"];
  recipientIds: string[];
}): Promise<boolean> {
  const recipientIds = [...new Set(input.recipientIds)];
  if (recipientIds.length === 0) {
    return true;
  }

  const created = notificationService.createNotificationsForRecipients({
    title: input.title,
    message: input.message,
    priority: input.priority,
    recipientIds,
  });
  if (!(await ensureStorageSynced())) {
    return false;
  }

  const modalNotification = created.find(
    (notification) =>
      notification.recipientId === requireLoggedInUser().id &&
      (notification.priority === "medium" || notification.priority === "high"),
  );

  if (modalNotification) {
    notificationModalController.show(modalNotification);
  }

  sidePanels.updateUnreadCounter();
  sidePanels.renderNotifications();
  sidePanels.renderNotificationDetails();
  return true;
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

async function setActiveProject(projectId: string): Promise<void> {
  activeProjectService.setActiveProjectId(projectId);
  if (!(await ensureStorageSynced())) {
    return;
  }
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
  boardPanels.renderProjects();
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
  await boardActionsController.deleteProject(id);
}

function renderStories(): void {
  boardPanels.renderStories();
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
  await boardActionsController.deleteStory(id);
}

function renderTaskStoryOptions(): void {
  boardPanels.renderTaskStoryOptions();
}

function renderTasks(): void {
  boardPanels.renderTasks();
}

function renderTaskDetails(): void {
  boardPanels.renderTaskDetails();
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
  await boardActionsController.deleteTask(id);
}

async function assignSelectedTask(taskId: string): Promise<void> {
  await boardActionsController.assignSelectedTask(taskId);
}

async function finishSelectedTask(taskId: string): Promise<void> {
  await boardActionsController.finishSelectedTask(taskId);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

boardActionsController.bindFormSubmits();

bindAppEvents(appDom, {
  onProjectCancel: cancelProjectEdit,
  onStoryCancel: cancelStoryEdit,
  onTaskCancel: cancelTaskEdit,
  onOpenBoardView: () => setActiveView("board"),
  onOpenNotificationsView: () => {
    sidePanels.renderNotifications();
    setActiveView("notifications");
  },
  onOpenUsersView: () => {
    sidePanels.renderUsers();
    setActiveView("users");
  },
  onNotificationsBack: () => setActiveView("board"),
  onNotificationDetailsBack: () => setActiveView("notifications"),
  onUnreadCounterClick: () => {
    sidePanels.renderNotifications();
    setActiveView("notifications");
  },
  onLogout: () => authController.logoutAndShowLogin(),
});
notificationModalController.bindEvents();

themeController.init();
if (!loggedInUser) {
  appShell.classList.add("hidden");
  blockedView.classList.add("hidden");
  loginView.classList.remove("hidden");
  authController.initGoogleLogin();
} else if (loggedInUser.isBlocked) {
  appShell.classList.add("hidden");
  loginView.classList.add("hidden");
  blockedView.classList.remove("hidden");
} else {
  authController.syncLoggedUserName();
  renderStoryOwnerOptions();
  renderProjects();
  renderStories();
  renderTaskStoryOptions();
  renderTasks();
  renderTaskDetails();
  sidePanels.renderNotifications();
  sidePanels.renderNotificationDetails();
  sidePanels.updateUnreadCounter();
  sidePanels.renderUsers();
  authController.applyAccessMode();
}
}
