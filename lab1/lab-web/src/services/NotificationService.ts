import type {
  Notification,
  NotificationPriority,
  UserID,
} from "../models/Notification";

const STORAGE_KEY = "manageme_notifications";

export class NotificationService {
  private getAll(): Notification[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Notification[]) : [];
  }

  private saveAll(notifications: Notification[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  getNotificationsByRecipient(recipientId: UserID): Notification[] {
    return this.getAll()
      .filter((notification) => notification.recipientId === recipientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getUnreadCountByRecipient(recipientId: UserID): number {
    return this.getNotificationsByRecipient(recipientId).filter(
      (notification) => !notification.isRead,
    ).length;
  }

  getNotificationById(id: string): Notification | undefined {
    return this.getAll().find((notification) => notification.id === id);
  }

  createNotification(input: {
    title: string;
    message: string;
    priority: NotificationPriority;
    recipientId: UserID;
  }): Notification {
    const notification: Notification = {
      id: this.generateId(),
      title: input.title,
      message: input.message,
      date: new Date().toISOString(),
      priority: input.priority,
      isRead: false,
      recipientId: input.recipientId,
    };

    const notifications = this.getAll();
    notifications.push(notification);
    this.saveAll(notifications);
    return notification;
  }

  createNotificationsForRecipients(input: {
    title: string;
    message: string;
    priority: NotificationPriority;
    recipientIds: UserID[];
  }): Notification[] {
    const notifications = input.recipientIds.map((recipientId) =>
      this.createNotification({
        title: input.title,
        message: input.message,
        priority: input.priority,
        recipientId,
      }),
    );
    return notifications;
  }

  markAsRead(id: string): Notification | null {
    const notifications = this.getAll();
    const index = notifications.findIndex((notification) => notification.id === id);
    if (index === -1) {
      return null;
    }

    notifications[index] = {
      ...notifications[index],
      isRead: true,
    };
    this.saveAll(notifications);
    return notifications[index];
  }
}
