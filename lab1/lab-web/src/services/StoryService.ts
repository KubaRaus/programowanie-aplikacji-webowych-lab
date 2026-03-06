import type { Story, StoryPriority, StoryStatus } from "../models/Story";

const STORAGE_KEY = "manageme_stories";

export class StoryService {
  private getAll(): Story[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveAll(stories: Story[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  getStoriesByProject(projectId: string): Story[] {
    return this.getAll().filter((story) => story.projectId === projectId);
  }

  getStoryById(id: string): Story | undefined {
    return this.getAll().find((story) => story.id === id);
  }

  createStory(input: {
    name: string;
    description: string;
    priority: StoryPriority;
    projectId: string;
    status: StoryStatus;
    ownerId: string;
  }): Story {
    const story: Story = {
      id: this.generateId(),
      name: input.name,
      description: input.description,
      priority: input.priority,
      projectId: input.projectId,
      createdAt: new Date().toISOString(),
      status: input.status,
      ownerId: input.ownerId,
    };

    const stories = this.getAll();
    stories.push(story);
    this.saveAll(stories);
    return story;
  }

  updateStory(
    id: string,
    updates: {
      name: string;
      description: string;
      priority: StoryPriority;
      status: StoryStatus;
      ownerId: string;
    },
  ): Story | null {
    const stories = this.getAll();
    const index = stories.findIndex((story) => story.id === id);

    if (index === -1) {
      return null;
    }

    stories[index] = {
      ...stories[index],
      name: updates.name,
      description: updates.description,
      priority: updates.priority,
      status: updates.status,
      ownerId: updates.ownerId,
    };

    this.saveAll(stories);
    return stories[index];
  }

  deleteStory(id: string): boolean {
    const stories = this.getAll();
    const filtered = stories.filter((story) => story.id !== id);
    if (filtered.length === stories.length) {
      return false;
    }

    this.saveAll(filtered);
    return true;
  }

  deleteStoriesByProject(projectId: string): void {
    const stories = this.getAll().filter(
      (story) => story.projectId !== projectId,
    );
    this.saveAll(stories);
  }
}
