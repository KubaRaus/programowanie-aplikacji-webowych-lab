export const APP_CONFIG = {
  superAdminEmail:
    import.meta.env.VITE_SUPER_ADMIN_EMAIL?.trim().toLowerCase() ??
    "super-admin@example.com",
};
