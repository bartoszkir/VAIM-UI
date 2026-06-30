import { downloadFileFromResponse, getApiBaseUrl } from "./download";
import { httpClient } from "./httpClient";
import type {
  PromptCreateFromMarkdownRequest,
  PromptCreateRequest,
  PromptDto,
  PromptDtoPagedResult,
  PromptType,
  PromptTypeDto,
  PromptUpdateRequest,
  ToolType,
  ToolTypeDto,
} from "./types";

export type GetPromptsParams = {
  type?: PromptType;
  toolType?: ToolType;
  tagIds?: string[];
};

export type GetPagedPromptsParams = {
  page?: number;
  pageSize?: number;
  type?: PromptType;
  search?: string;
  toolType?: ToolType;
  tag?: string | string[];
  tagIds?: string[];
};

export async function getPromptTypes(): Promise<PromptTypeDto[]> {
  return httpClient.get<PromptTypeDto[]>("/prompts/types");
}

export async function getToolTypes(): Promise<ToolTypeDto[]> {
  return httpClient.get<ToolTypeDto[]>("/prompts/toolTypes");
}

export async function getPrompts(
  params: GetPromptsParams = {},
): Promise<PromptDto[]> {
  return httpClient.get<PromptDto[]>("/prompts", {
    query: {
      type: params.type,
      toolType: params.toolType,
      tagIds: params.tagIds,
    },
  });
}

export async function getPagedPrompts(
  params: GetPagedPromptsParams = {},
): Promise<PromptDtoPagedResult> {
  return httpClient.get<PromptDtoPagedResult>("/prompts/paging", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      type: params.type,
      search: params.search,
      toolType: params.toolType,
      tag: params.tag,
      tagIds: params.tagIds,
    },
  });
}

export async function getPromptById(id: string): Promise<PromptDto> {
  return httpClient.get<PromptDto>(`/prompts/${id}`);
}

export async function createPrompt(
  request: PromptCreateRequest,
): Promise<PromptDto> {
  return httpClient.post<PromptDto>("/prompts/create", request);
}

export async function createPromptFromMarkdown(
  request: PromptCreateFromMarkdownRequest,
): Promise<PromptDto> {
  return httpClient.post<PromptDto>("/prompts/create/markdown", request);
}

export async function updatePrompt(
  id: string,
  request: PromptUpdateRequest,
): Promise<PromptDto> {
  return httpClient.put<PromptDto>(`/prompts/${id}`, request);
}

export async function likePrompt(id: string): Promise<void> {
  return httpClient.post<void>(`/prompts/${id}/like`);
}

export async function unlikePrompt(id: string): Promise<void> {
  return httpClient.delete<void>(`/prompts/${id}/like`);
}

export async function getMyLikedPromptIds(): Promise<string[]> {
  return httpClient.get<string[]>("/prompts/my-likes");
}

export async function downloadPromptMarkdown(id: string): Promise<void> {
  const url = `${getApiBaseUrl()}/prompts/${id}/download`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  return downloadFileFromResponse(response, url, `prompt-${id}.md`);
}
