import { httpClient } from "./httpClient";
import type { SearchResult } from "./types";

export async function searchAll(query: string): Promise<SearchResult> {
  return httpClient.get<SearchResult>("/search", {
    query: { q: query },
  });
}
