import { httpClient } from "./httpClient";
import type { GitHubAssetDto, PromptType } from "./types";

export async function getGitHubAssets(): Promise<GitHubAssetDto[]> {
  return httpClient.get<GitHubAssetDto[]>("/github-marketplace");
}

export async function getGitHubAssetsByType(
  type: PromptType,
): Promise<GitHubAssetDto[]> {
  return httpClient.get<GitHubAssetDto[]>(
    `/github-marketplace/by-type/${type}`,
  );
}

export async function getGitHubAssetsByCategory(
  category: string,
): Promise<GitHubAssetDto[]> {
  return httpClient.get<GitHubAssetDto[]>(
    `/github-marketplace/by-category/${encodeURIComponent(category)}`,
  );
}

export async function getGitHubCategories(): Promise<
  Record<string, PromptType>
> {
  return httpClient.get<Record<string, PromptType>>(
    "/github-marketplace/categories",
  );
}

export async function invalidateGitHubCache(category?: string): Promise<void> {
  const path = category
    ? `/github-marketplace/cache/invalidate/${encodeURIComponent(category)}`
    : "/github-marketplace/cache/invalidate";

  return httpClient.post<void>(path);
}
