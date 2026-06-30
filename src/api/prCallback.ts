import { httpClient } from "./httpClient";
import type { PrCallbackRequest } from "./types";

export async function notifyPrMerged(
  request: PrCallbackRequest,
): Promise<void> {
  return httpClient.post<void>("/github/pr-callback/merged", request);
}

export async function notifyPrDeclined(
  request: PrCallbackRequest,
): Promise<void> {
  return httpClient.post<void>("/github/pr-callback/declined", request);
}
