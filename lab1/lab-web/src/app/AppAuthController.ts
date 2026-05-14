import type { User, UserRole } from "../models/User";
import { UserService } from "../services/UserService";
import {
  parseJwtPayload,
  splitName,
  validateGooglePayload,
} from "./GoogleAuthUtils";

type AppView = "board" | "notifications" | "notification-details" | "users";

type AppAuthControllerOptions = {
  userService: UserService;
  googleClientId: string;
  superAdminEmail: string;
  loginError: HTMLParagraphElement;
  loggedUserName: HTMLSpanElement;
  googleLoginButton: HTMLDivElement;
  loginView: HTMLElement;
  blockedView: HTMLElement;
  appShell: HTMLElement;
  menuUsersBtn: HTMLButtonElement;
  menuBoardBtn: HTMLButtonElement;
  menuNotificationsBtn: HTMLButtonElement;
  unreadCounterBtn: HTMLButtonElement;
  guestPendingView: HTMLElement;
  boardView: HTMLElement;
  notificationsView: HTMLElement;
  notificationDetailsView: HTMLElement;
  usersView: HTMLElement;
  getLoggedInUser: () => User | null;
  setLoggedInUser: (value: User | null) => void;
  getRoleLabel: (role: UserRole) => string;
  ensureStorageSynced: () => Promise<boolean>;
  sendNewAccountNotification: (newUser: User) => Promise<boolean>;
  setActiveView: (view: AppView) => void;
  onActiveUserSession: () => void;
};

export function createAppAuthController(options: AppAuthControllerOptions) {
  let googleLoginInitRetries = 0;

  function setLoginError(message: string | null): void {
    if (!message) {
      options.loginError.textContent = "";
      options.loginError.classList.add("hidden");
      return;
    }
    options.loginError.textContent = message;
    options.loginError.classList.remove("hidden");
  }

  function requireLoggedInUser(): User {
    const user = options.getLoggedInUser();
    if (!user) {
      throw new Error("Brak zalogowanego uzytkownika.");
    }
    return user;
  }

  function syncLoggedUserName(): void {
    const user = requireLoggedInUser();
    options.loggedUserName.textContent = `${user.firstName} ${user.lastName} (${options.getRoleLabel(user.role)})`;
  }

  function applyAccessMode(): void {
    const user = requireLoggedInUser();
    const isAdmin = user.role === "admin";
    const isGuest = user.role === "guest";

    options.loginView.classList.add("hidden");
    options.blockedView.classList.add("hidden");
    options.appShell.classList.remove("hidden");
    options.menuUsersBtn.classList.toggle("hidden", !isAdmin);
    options.menuBoardBtn.classList.toggle("hidden", isGuest);
    options.menuNotificationsBtn.classList.toggle("hidden", isGuest);
    options.unreadCounterBtn.classList.toggle("hidden", isGuest);
    options.guestPendingView.classList.toggle("hidden", !isGuest);
    options.boardView.classList.toggle("hidden", isGuest);
    options.notificationsView.classList.toggle("hidden", isGuest);
    options.notificationDetailsView.classList.toggle("hidden", true);
    options.usersView.classList.toggle("hidden", true);

    if (isGuest) {
      options.menuBoardBtn.classList.remove("active");
      options.menuNotificationsBtn.classList.remove("active");
      options.menuUsersBtn.classList.remove("active");
      return;
    }

    options.setActiveView("board");
  }

  async function handleGoogleCredential(
    response: GoogleCredentialResponse,
  ): Promise<void> {
    try {
      const payload = parseJwtPayload(response.credential);
      validateGooglePayload(payload, options.googleClientId);
      const email = String(payload.email ?? "").trim().toLowerCase();
      if (!email) {
        throw new Error("Brak emaila w odpowiedzi dostawcy OAuth.");
      }
      const payloadName = String(payload.name ?? "");
      const names = splitName(payloadName);
      const firstName = String(payload.given_name ?? names.firstName);
      const lastName = String(payload.family_name ?? names.lastName);
      const result = options.userService.loginWithOAuthProfile(
        { email, firstName, lastName },
        options.superAdminEmail,
      );
      if (!(await options.ensureStorageSynced())) {
        return;
      }

      options.setLoggedInUser(result.user);
      if (result.isNewUser) {
        if (!(await options.sendNewAccountNotification(result.user))) {
          return;
        }
      }

      if (result.user.isBlocked) {
        options.appShell.classList.add("hidden");
        options.loginView.classList.add("hidden");
        options.blockedView.classList.remove("hidden");
        return;
      }

      syncLoggedUserName();
      applyAccessMode();
      options.onActiveUserSession();
      setLoginError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nie udalo sie zalogowac.";
      setLoginError(message);
    }
  }

  function initGoogleLogin(): void {
    if (!options.googleClientId) {
      setLoginError(
        "Brak VITE_GOOGLE_CLIENT_ID w konfiguracji. Dodaj zmienna srodowiskowa.",
      );
      return;
    }

    if (!window.google?.accounts?.id) {
      if (googleLoginInitRetries < 8) {
        googleLoginInitRetries += 1;
        setTimeout(initGoogleLogin, 300);
        return;
      }
      setLoginError("Nie mozna zaladowac biblioteki Google OAuth.");
      return;
    }

    googleLoginInitRetries = 0;
    window.google.accounts.id.initialize({
      client_id: options.googleClientId,
      callback: (response) => {
        void handleGoogleCredential(response);
      },
    });
    options.googleLoginButton.innerHTML = "";
    window.google.accounts.id.renderButton(options.googleLoginButton, {
      type: "standard",
      size: "large",
      text: "signin_with",
      shape: "pill",
      width: 260,
    });
  }

  function logoutAndShowLogin(): void {
    options.userService.logout();
    options.setLoggedInUser(null);
    options.appShell.classList.add("hidden");
    options.blockedView.classList.add("hidden");
    options.loginView.classList.remove("hidden");
    setLoginError(null);
    initGoogleLogin();
  }

  return {
    syncLoggedUserName,
    applyAccessMode,
    initGoogleLogin,
    logoutAndShowLogin,
  };
}
