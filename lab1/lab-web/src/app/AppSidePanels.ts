import type { Notification } from "../models/Notification";
import type { User, UserRole } from "../models/User";
import { NotificationService } from "../services/NotificationService";
import { UserService } from "../services/UserService";

type AppView = "board" | "notifications" | "notification-details" | "users";

type AppSidePanelsOptions = {
  notificationService: NotificationService;
  userService: UserService;
  notificationsList: HTMLDivElement;
  notificationDetails: HTMLDivElement;
  unreadCounterValue: HTMLSpanElement;
  usersList: HTMLDivElement;
  storyOwnerInput: HTMLSelectElement;
  getCurrentUser: () => User;
  getLoggedInUser: () => User | null;
  setLoggedInUser: (value: User | null) => void;
  ensureStorageSynced: () => Promise<boolean>;
  setActiveView: (view: AppView) => void;
  renderStoryOwnerOptions: (selectedOwnerId?: string) => void;
  syncLoggedUserName: () => void;
  applyAccessMode: () => void;
  escapeHtml: (value: string) => string;
  formatDate: (value: string | null) => string;
  formatNotificationPriority: (value: Notification["priority"]) => string;
};

export function createAppSidePanels(options: AppSidePanelsOptions) {
  let selectedNotificationId: string | null = null;

  function getMyNotifications(): Notification[] {
    return options.notificationService.getNotificationsByRecipient(
      options.getCurrentUser().id,
    );
  }

  function updateUnreadCounter(): void {
    options.unreadCounterValue.textContent = String(
      options.notificationService.getUnreadCountByRecipient(
        options.getCurrentUser().id,
      ),
    );
  }

  async function markNotificationAsRead(notificationId: string): Promise<void> {
    options.notificationService.markAsRead(notificationId);
    if (!(await options.ensureStorageSynced())) {
      return;
    }
    updateUnreadCounter();
    renderNotifications();
    renderNotificationDetails();
  }

  async function openNotificationDetails(notificationId: string): Promise<void> {
    selectedNotificationId = notificationId;
    options.notificationService.markAsRead(notificationId);
    if (!(await options.ensureStorageSynced())) {
      return;
    }
    updateUnreadCounter();
    options.setActiveView("notification-details");
    renderNotifications();
    renderNotificationDetails();
  }

  function renderNotifications(): void {
    const notifications = getMyNotifications();
    if (notifications.length === 0) {
      options.notificationsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔔</span>
        <p>Brak powiadomien.</p>
      </div>
    `;
      return;
    }

    options.notificationsList.innerHTML = notifications
      .map(
        (notification) => `
      <article class="notification-card ${notification.isRead ? "notification-read" : "notification-unread"}">
        <h3>${options.escapeHtml(notification.title)}</h3>
        <p>${options.escapeHtml(notification.message)}</p>
        <div class="notification-meta">
          <span>Priorytet: ${options.formatNotificationPriority(notification.priority)}</span>
          <span>Data: ${options.formatDate(notification.date)}</span>
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

    options.notificationsList
      .querySelectorAll(".btn-notification-details")
      .forEach((button) => {
        button.addEventListener("click", () =>
          void openNotificationDetails((button as HTMLElement).dataset.id!),
        );
      });

    options.notificationsList
      .querySelectorAll(".btn-notification-read")
      .forEach((button) => {
        button.addEventListener("click", () =>
          void markNotificationAsRead((button as HTMLElement).dataset.id!),
        );
      });
  }

  function renderNotificationDetails(): void {
    const notification = selectedNotificationId
      ? options.notificationService.getNotificationById(selectedNotificationId)
      : null;

    if (!notification || notification.recipientId !== options.getCurrentUser().id) {
      options.notificationDetails.innerHTML = `
      <h3>Szczegoly powiadomienia</h3>
      <p class="column-empty">Wybierz powiadomienie z listy.</p>
    `;
      return;
    }

    options.notificationDetails.innerHTML = `
    <h3>${options.escapeHtml(notification.title)}</h3>
    <div class="details-grid">
      <p><strong>Priorytet:</strong> ${options.formatNotificationPriority(notification.priority)}</p>
      <p><strong>Data:</strong> ${options.formatDate(notification.date)}</p>
      <p><strong>Status:</strong> ${notification.isRead ? "Przeczytane" : "Nieprzeczytane"}</p>
    </div>
    <p>${options.escapeHtml(notification.message)}</p>
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
    const currentUser = options.getCurrentUser();
    if (currentUser.role !== "admin") {
      options.usersList.innerHTML = `
      <p class="column-empty">Dostep tylko dla administratorow.</p>
    `;
      return;
    }

    const users = options.userService.getUsers();
    if (users.length === 0) {
      options.usersList.innerHTML = `
      <p class="column-empty">Brak uzytkownikow.</p>
    `;
      return;
    }

    options.usersList.innerHTML = users
      .map(
        (user) => `
      <article class="user-card ${user.isBlocked ? "user-card-blocked" : ""}">
        <div>
          <h3>${options.escapeHtml(user.firstName)} ${options.escapeHtml(user.lastName)}</h3>
          <p>${options.escapeHtml(user.email)}</p>
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

    options.usersList.querySelectorAll(".user-role-select").forEach((element) => {
      element.addEventListener("change", async () => {
        const select = element as HTMLSelectElement;
        const userId = select.dataset.id ?? "";
        const role = select.value as UserRole;
        const updated = options.userService.updateUserRole(userId, role);
        if (!updated) {
          return;
        }
        if (!(await options.ensureStorageSynced())) {
          renderUsers();
          return;
        }
        const loggedInUser = options.getLoggedInUser();
        if (loggedInUser && loggedInUser.id === updated.id) {
          options.setLoggedInUser(updated);
        }
        renderUsers();
        options.renderStoryOwnerOptions(options.storyOwnerInput.value);
        options.syncLoggedUserName();
        options.applyAccessMode();
      });
    });

    options.usersList.querySelectorAll(".btn-user-block").forEach((button) => {
      button.addEventListener("click", async () => {
        const userId = (button as HTMLElement).dataset.id ?? "";
        const target = options.userService.getUserById(userId);
        if (!target) {
          return;
        }
        const updated = options.userService.setUserBlocked(userId, !target.isBlocked);
        if (!updated) {
          return;
        }
        if (!(await options.ensureStorageSynced())) {
          renderUsers();
          return;
        }
        const loggedInUser = options.getLoggedInUser();
        if (loggedInUser && loggedInUser.id === updated.id) {
          options.setLoggedInUser(updated);
        }
        renderUsers();
        options.renderStoryOwnerOptions(options.storyOwnerInput.value);
        options.applyAccessMode();
      });
    });
  }

  return {
    updateUnreadCounter,
    openNotificationDetails,
    renderNotifications,
    renderNotificationDetails,
    renderUsers,
  };
}
