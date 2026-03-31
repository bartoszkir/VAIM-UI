export default {
  applicationName: import.meta.env.VITE_APPLICATION_NAME || "AI Marketplace",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  signInUrl:
    import.meta.env.VITE_SIGN_IN_URL || "http://localhost:4000/api/auth/signin",
  signOutUrl:
    import.meta.env.VITE_SIGN_OUT_URL ||
    "http://localhost:4000/api/auth/signout",
};
