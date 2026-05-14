import type { Notification } from "../models/Notification";

type NotificationModalPriority = Notification["priority"];

type OpenDetailsHandler = (notificationId: string) => void;

type NotificationModalControllerOptions = {
  backdrop: HTMLDivElement;
  title: HTMLHeadingElement;
  message: HTMLParagraphElement;
  priority: HTMLSpanElement;
  date: HTMLSpanElement;
  openButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  formatDate: (value: string | null) => string;
  formatPriority: (value: NotificationModalPriority) => string;
  onOpenDetails: OpenDetailsHandler;
};

export function createNotificationModalController(
  options: NotificationModalControllerOptions,
) {
  let activeNotificationId: string | null = null;

  function show(notification: Notification): void {
    activeNotificationId = notification.id;
    options.title.textContent = notification.title;
    options.message.textContent = notification.message;
    options.priority.textContent = `Priorytet: ${options.formatPriority(
      notification.priority,
    )}`;
    options.date.textContent = options.formatDate(notification.date);
    options.backdrop.classList.remove("hidden");
  }

  function close(): void {
    activeNotificationId = null;
    options.backdrop.classList.add("hidden");
  }

  function bindEvents(): void {
    options.closeButton.addEventListener("click", close);
    options.backdrop.addEventListener("click", (event) => {
      if (event.target === options.backdrop) {
        close();
      }
    });
    options.openButton.addEventListener("click", () => {
      if (!activeNotificationId) {
        return;
      }
      const notificationId = activeNotificationId;
      close();
      options.onOpenDetails(notificationId);
    });
  }

  return {
    show,
    close,
    bindEvents,
  };
}
