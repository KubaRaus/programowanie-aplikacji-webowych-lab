import type { AppDom } from "./AppDom";

type AppEventHandlers = {
  onProjectCancel: () => void;
  onStoryCancel: () => void;
  onTaskCancel: () => void;
  onOpenBoardView: () => void;
  onOpenNotificationsView: () => void;
  onOpenUsersView: () => void;
  onNotificationsBack: () => void;
  onNotificationDetailsBack: () => void;
  onUnreadCounterClick: () => void;
  onLogout: () => void;
};

export function bindAppEvents(dom: AppDom, handlers: AppEventHandlers): void {
  dom.projectCancelBtn.addEventListener("click", handlers.onProjectCancel);
  dom.storyCancelBtn.addEventListener("click", handlers.onStoryCancel);
  dom.taskCancelBtn.addEventListener("click", handlers.onTaskCancel);
  dom.menuBoardBtn.addEventListener("click", handlers.onOpenBoardView);
  dom.menuNotificationsBtn.addEventListener(
    "click",
    handlers.onOpenNotificationsView,
  );
  dom.menuUsersBtn.addEventListener("click", handlers.onOpenUsersView);
  dom.notificationsBackBtn.addEventListener("click", handlers.onNotificationsBack);
  dom.notificationDetailsBackBtn.addEventListener(
    "click",
    handlers.onNotificationDetailsBack,
  );
  dom.unreadCounterBtn.addEventListener("click", handlers.onUnreadCounterClick);
  dom.logoutBtn.addEventListener("click", handlers.onLogout);
  dom.blockedLogoutBtn.addEventListener("click", handlers.onLogout);
}
