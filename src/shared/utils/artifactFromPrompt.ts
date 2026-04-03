import type { PromptDto } from "../../api/types";
import type { ArtifactItem } from "../types/artifacts";

const DEFAULT_TOOLS = ["GitHub Copilot", "Claude Code"];

export function artifactFromPrompt(prompt: PromptDto): ArtifactItem {
  const title = prompt.name?.trim() || "Untitled artifact";
  const description = prompt.description?.trim() || "No description provided.";

  return {
    id: prompt.id,
    title,
    author: prompt.authorId,
    publishedAt: prompt.createdAt,
    description,
    tools: DEFAULT_TOOLS,
    tags: (prompt.tags ?? [])
      .map((tag) => tag.name)
      .filter(Boolean) as string[],
    favorites: prompt.likesCount,
    isFavorite: false,
    comments: 0,
    updatedAt: prompt.updatedAt ?? prompt.createdAt,
  };
}
