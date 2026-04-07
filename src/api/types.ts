export const PromptType = {
  Prompt: 1,
  Agent: 2,
  Instruction: 3,
  Skill: 4,
} as const;

export type PromptType = (typeof PromptType)[keyof typeof PromptType];

export const ToolType = {
  Copilot: 1,
  Claude: 2,
} as const;

export type ToolType = (typeof ToolType)[keyof typeof ToolType];

export type ProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: unknown;
};

export type PromptTypeDto = {
  id: PromptType;
  name: string;
};

export type ToolTypeDto = {
  id: ToolType;
  name: string;
};

export type TagDto = {
  id: string;
  name?: string | null;
};

export type PromptDto = {
  id: string;
  name?: string | null;
  description?: string | null;
  content?: string | null;
  authorId: string;
  authorDisplayName?: string | null;
  isPublic: boolean;
  type: PromptType;
  createdAt: string;
  updatedAt?: string | null;
  tags?: TagDto[] | null;
  toolTypes?: ToolType[] | null;
  likesCount: number;
};

export type PromptDtoPagedResult = {
  items?: PromptDto[] | null;
  totalCount: number;
  page: number;
  pageSize: number;
};

export type PromptCreateRequest = {
  name?: string | null;
  description?: string | null;
  content?: string | null;
  type: PromptType;
  tagIds?: string[] | null;
};

export type PromptCreateFromMarkdownRequest = {
  markdownText?: string | null;
  type: PromptType;
};

export type PromptUpdateRequest = {
  name?: string | null;
  description?: string | null;
  content?: string | null;
  type: PromptType;
  tagIds?: string[] | null;
  isPublic: boolean;
};

export type TagCreateRequest = {
  name?: string | null;
};

export type TagUpdateRequest = {
  name?: string | null;
};
