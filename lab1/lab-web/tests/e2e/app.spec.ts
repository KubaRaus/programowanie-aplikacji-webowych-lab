import { expect, test, type Page } from "@playwright/test";

const adminUser = {
  id: "user-admin-e2e",
  email: "admin-e2e@example.com",
  firstName: "Admin",
  lastName: "E2E",
  role: "admin",
  isBlocked: false,
};

const developerUser = {
  id: "user-dev-e2e",
  email: "dev-e2e@example.com",
  firstName: "Dev",
  lastName: "E2E",
  role: "developer",
  isBlocked: false,
};

async function closeNotificationModalIfVisible(page: Page): Promise<void> {
  const closeButton = page.locator("#notification-modal-close-btn");
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }
}

async function createProject(page: Page, name = "Projekt E2E"): Promise<void> {
  await page.fill("#project-name", name);
  await page.fill("#project-desc", `Opis: ${name}`);
  await page.click("#project-submit-btn");
  await closeNotificationModalIfVisible(page);
}

async function createStory(page: Page, name = "Historyjka E2E"): Promise<void> {
  await page.fill("#story-name", name);
  await page.fill("#story-desc", `Opis: ${name}`);
  await page.selectOption("#story-priority", "wysoki");
  await page.selectOption("#story-status", "todo");
  await page.click("#story-submit-btn");
}

async function createTask(page: Page, name = "Zadanie E2E"): Promise<void> {
  await page.fill("#task-name", name);
  await page.fill("#task-desc", `Opis: ${name}`);
  await page.selectOption("#task-priority", "sredni");
  await page.fill("#task-estimated-hours", "5");
  await page.click("#task-submit-btn");
  await closeNotificationModalIfVisible(page);
}

async function openTaskDetails(page: Page): Promise<void> {
  await page.locator("#task-board .btn-task-details").first().click();
}

async function createProjectStoryAndTask(page: Page): Promise<void> {
  await createProject(page);
  await createStory(page);
  await createTask(page);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({
      users,
      loggedInUserId,
    }: {
      users: unknown[];
      loggedInUserId: string;
    }) => {
      localStorage.clear();
      localStorage.setItem("manageme_users", JSON.stringify(users));
      localStorage.setItem("manageme_logged_user_id", loggedInUserId);
      localStorage.setItem("manageme_projects", "[]");
      localStorage.setItem("manageme_stories", "[]");
      localStorage.setItem("manageme_tasks", "[]");
      localStorage.setItem("manageme_notifications", "[]");
      localStorage.removeItem("manageme_active_project_id");
    },
    { users: [adminUser, developerUser], loggedInUserId: adminUser.id },
  );
});

test("tworzenie projektu, historyjki i zadania", async ({ page }) => {
  await page.goto("/");

  await createProject(page);
  await expect(page.locator("#project-list")).toContainText("Projekt E2E");

  await createStory(page);
  await expect(page.locator("#story-board")).toContainText("Historyjka E2E");

  await createTask(page);
  await expect(page.locator("#task-board")).toContainText("Zadanie E2E");
});

test("zmiana statusu zadania", async ({ page }) => {
  await page.goto("/");
  await createProjectStoryAndTask(page);

  await openTaskDetails(page);
  await page.selectOption("#details-assignee", developerUser.id);
  await page.click("#assign-task-btn");
  await expect(page.locator("#task-details")).toContainText("doing");

  await page.fill("#details-worked-hours", "8");
  await page.click("#finish-task-btn");
  await closeNotificationModalIfVisible(page);
  await expect(page.locator("#task-details")).toContainText("done");
});

test("edycja projektu, historyjki i zadania", async ({ page }) => {
  await page.goto("/");
  await createProjectStoryAndTask(page);

  await page.locator("#project-list .btn-edit").first().click();
  await page.fill("#project-name", "Projekt E2E Edytowany");
  await page.fill("#project-desc", "Opis projektu E2E Edytowany");
  await page.click("#project-submit-btn");
  await expect(page.locator("#project-list")).toContainText("Projekt E2E Edytowany");

  await page.locator("#story-board .btn-story-edit").first().click();
  await page.fill("#story-name", "Historyjka E2E Edytowana");
  await page.fill("#story-desc", "Opis historyjki E2E Edytowany");
  await page.selectOption("#story-status", "doing");
  await page.click("#story-submit-btn");
  await expect(page.locator("#story-board")).toContainText("Historyjka E2E Edytowana");

  await page.locator("#task-board .btn-task-edit").first().click();
  await page.fill("#task-name", "Zadanie E2E Edytowane");
  await page.fill("#task-desc", "Opis zadania E2E Edytowany");
  await page.selectOption("#task-priority", "wysoki");
  await page.fill("#task-estimated-hours", "13");
  await page.click("#task-submit-btn");
  await expect(page.locator("#task-board")).toContainText("Zadanie E2E Edytowane");
});

test("usuniecie zadania, historyjki i projektu", async ({
  page,
}) => {
  await page.goto("/");
  await createProjectStoryAndTask(page);

  page.on("dialog", (dialog) => dialog.accept());

  await page.locator("#task-board .btn-task-delete").first().click();
  await closeNotificationModalIfVisible(page);
  await expect(page.locator("#task-board")).not.toContainText("Zadanie E2E");

  await page.locator("#story-board .btn-story-delete").first().click();
  await expect(page.locator("#story-board")).not.toContainText("Historyjka E2E");

  await page.locator("#project-list .btn-delete").first().click();
  await expect(page.locator("#project-list")).not.toContainText("Projekt E2E");
});
