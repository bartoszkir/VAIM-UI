import config from "../config";

export async function getCurrentUser() {
  const response = await fetch(`${config.apiBaseUrl}/auth/me`);
  return response.json();
}
