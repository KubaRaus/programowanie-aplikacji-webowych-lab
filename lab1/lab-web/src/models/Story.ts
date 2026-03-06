export type StoryPriority = "niski" | "sredni" | "wysoki";
export type StoryStatus = "todo" | "doing" | "done";

export interface Story {
  id: string;
  name: string;
  description: string;
  priority: StoryPriority;
  projectId: string;
  createdAt: string;
  status: StoryStatus;
  ownerId: string;
}
