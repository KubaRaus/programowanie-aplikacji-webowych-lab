type Theme = "light" | "dark";

type ThemeControllerOptions = {
  toggleButton: HTMLButtonElement;
  storageKey: string;
};

export function createAppThemeController(options: ThemeControllerOptions) {
  function updateThemeToggleLabel(theme: Theme): void {
    options.toggleButton.textContent = theme === "dark" ? "☀️ Jasny" : "🌙 Ciemny";
  }

  function applyTheme(theme: Theme): void {
    document.documentElement.classList.toggle("dark", theme === "dark");
    updateThemeToggleLabel(theme);
  }

  function getThemePreference(): Theme {
    const saved = localStorage.getItem(options.storageKey);
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function init(): void {
    applyTheme(getThemePreference());

    options.toggleButton.addEventListener("click", () => {
      const isDark = document.documentElement.classList.contains("dark");
      const nextTheme: Theme = isDark ? "light" : "dark";
      localStorage.setItem(options.storageKey, nextTheme);
      applyTheme(nextTheme);
    });

    const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    darkMediaQuery.addEventListener("change", (event) => {
      const hasSavedTheme = localStorage.getItem(options.storageKey);
      if (hasSavedTheme) {
        return;
      }

      applyTheme(event.matches ? "dark" : "light");
    });
  }

  return {
    init,
  };
}
