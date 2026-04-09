import type { UserInfo } from "../auth/types";
import { httpClient } from "./httpClient";

export async function getCurrentUser(): Promise<UserInfo> {
  return httpClient.get<UserInfo>("/auth/me", {
    expectedContentType: "application/json",
  });
}
