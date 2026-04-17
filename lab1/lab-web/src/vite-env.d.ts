/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPER_ADMIN_EMAIL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
