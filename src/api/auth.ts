import { httpClient } from "./httpClient";
import type { CurrentUserDto } from "./types";

export async function getCurrentUser(): Promise<CurrentUserDto> {
  return httpClient.get<CurrentUserDto>("/auth/me", {
    expectedContentType: "application/json",
  });
}
