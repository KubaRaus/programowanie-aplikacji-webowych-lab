/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPER_ADMIN_EMAIL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_DATA_STORAGE_MODE?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
