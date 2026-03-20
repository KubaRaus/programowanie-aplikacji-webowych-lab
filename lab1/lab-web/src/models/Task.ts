import type { StoryPriority } from "./Story";

export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: StoryPriority;
  storyId: string;
  projectId: string;
  estimatedHours: number;
  workedHours: number;
  status: TaskStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  assigneeId: string | null;
}
