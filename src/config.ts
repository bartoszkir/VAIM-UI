export default {
  applicationName: import.meta.env.VITE_APPLICATION_NAME || "AI Marketplace",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "https://vaim-app-hzdhefe2cwhybzge.northeurope-01.azurewebsites.net/api",
  signInUrl:
    import.meta.env.VITE_SIGN_IN_URL || "https://vaim-app-hzdhefe2cwhybzge.northeurope-01.azurewebsites.net/api/auth/signin",
  signOutUrl:
    import.meta.env.VITE_SIGN_OUT_URL ||
    "https://vaim-app-hzdhefe2cwhybzge.northeurope-01.azurewebsites.net/api/auth/signout",
};
