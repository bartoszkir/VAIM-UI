export const PromptType = {
  Prompt: 1,
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

export type UserCompanyDto = {
  identity: string;
  internalId: string | null;
  isAdmin: boolean | null;
  name: string;
  id: string;
  description: string | null;
};

export type CurrentUserDto = {
  profilePageUrl: string;
  messagesUrl: string;
  identity: string;
  servicesUrl: string;
  companiesUrl: string;
  name: string;
  email: string;
  id: string;
  company: UserCompanyDto;
  numberOfCompanies: number;
  verifiedEmail: boolean;
  language: string | null;
  firstName: string;
  lastName: string;
  extensions: Record<string, unknown> | null;
  managedAccount: boolean;
  activated: boolean;
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
  toolTypes?: ToolType[] | null;
  tagIds?: string[] | null;
};

export type PromptCreateFromMarkdownRequest = {
  markdownText?: string | null;
  type: PromptType;
  toolTypes?: ToolType[] | null;
};

export type PromptUpdateRequest = {
  name?: string | null;
  description?: string | null;
  content?: string | null;
  type: PromptType;
  toolTypes?: ToolType[] | null;
  tagIds?: string[] | null;
  isPublic: boolean;
};

export type TagCreateRequest = {
  name?: string | null;
};

export type TagUpdateRequest = {
  name?: string | null;
};

export type BundleArtifactDto = {
  id: string;
  name?: string | null;
  description?: string | null;
  type: PromptType;
  toolTypes?: ToolType[] | null;
  tags?: TagDto[] | null;
};

export type BundleDto = {
  id: string;
  name?: string | null;
  description?: string | null;
  authorId: string;
  authorDisplayName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  isDynamic: boolean;
  toolTypes?: ToolType[] | null;
  tags?: TagDto[] | null;
  artifacts?: BundleArtifactDto[] | null;
};

export type BundleDtoPagedResult = {
  items?: BundleDto[] | null;
  totalCount: number;
  page: number;
  pageSize: number;
};

export type BundlePagedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  toolType?: ToolType;
  tagIds?: string[];
};

export type BundleGenerateRequest = {
  prompt: string;
};

export type BundleUpdateRequest = {
  name: string;
  description: string;
  artifactIds: string[];
  toolTypes?: ToolType[] | null;
  tagIds?: string[] | null;
};

export type BundleCreateRequest = {
  name: string;
  description: string;
  artifactIds: string[];
  toolTypes?: ToolType[] | null;
  tagIds?: string[] | null;
};

export type BundleDownloadByArtifactIdsRequest = {
  artifactIds: string[];
};
