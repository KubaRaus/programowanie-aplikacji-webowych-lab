export type DataStorageMode = "localStorage" | "database";

function parseStorageMode(value: string | undefined): DataStorageMode {
  if (value?.trim().toLowerCase() === "database") {
    return "database";
  }
  return "localStorage";
}

export const APP_CONFIG = {
  superAdminEmail:
    import.meta.env.VITE_SUPER_ADMIN_EMAIL?.trim().toLowerCase() ??
    "super-admin@example.com",
  dataStorageMode: parseStorageMode(import.meta.env.VITE_DATA_STORAGE_MODE),
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() ?? "",
  },
};
