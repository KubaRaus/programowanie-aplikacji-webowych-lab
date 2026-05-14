import type { Notification } from "../models/Notification";

export type NotificationDraft = {
  title: string;
  message: string;
  priority: Notification["priority"];
  recipientIds: string[];
};

export type WorkflowResult = {
  ok: boolean;
  error?: string;
  notifications: NotificationDraft[];
};
