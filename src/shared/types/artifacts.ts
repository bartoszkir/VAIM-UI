import type { PromptType } from "../../api/types";

export type ArtifactItem = {
  id: string;
  type: PromptType;
  title: string;
  author: string;
  publishedAt: string;
  description: string;
  tools: string[];
  tags: string[];
  favorites: number;
  isFavorite: boolean;
  comments: number;
  updatedAt: string;
};

export type UploadArtifactFormData = {
  title: string;
  description: string;
  content: string;
  tools: string[];
  tags: string[];
};
