import { httpClient } from "./httpClient";
import type { TagCreateRequest, TagDto, TagUpdateRequest } from "./types";

export async function getTags(): Promise<TagDto[]> {
  return httpClient.get<TagDto[]>("/tags");
}

export async function createTag(request: TagCreateRequest): Promise<TagDto> {
  return httpClient.post<TagDto>("/tags", request);
}

export async function updateTag(
  id: string,
  request: TagUpdateRequest,
): Promise<TagDto> {
  return httpClient.put<TagDto>(`/tags/${id}`, request);
}

export async function deleteTag(id: string): Promise<void> {
  return httpClient.delete<void>(`/tags/${id}`);
}
