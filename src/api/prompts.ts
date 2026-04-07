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
};

export type GetPagedPromptsParams = {
  page?: number;
  pageSize?: number;
  type?: PromptType;
  search?: string;
  toolType?: ToolType;
  tag?: string;
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

export async function getMyLikedPromptIds(): Promise<string[]> {
  return httpClient.get<string[]>("/prompts/my-likes");
}
