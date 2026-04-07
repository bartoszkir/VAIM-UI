import { ToolType } from "../../api/types";
import type { PromptDto } from "../../api/types";
import type { ArtifactItem } from "../types/artifacts";

const TOOL_TYPE_LABELS: Record<number, string> = {
  [ToolType.Copilot]: "GitHub Copilot",
  [ToolType.Claude]: "Claude Code",
};

function mapToolTypesToLabels(prompt: PromptDto): string[] {
  if (!prompt.toolTypes || prompt.toolTypes.length === 0) {
    return [];
  }

  return [
    ...new Set(prompt.toolTypes.map((tool) => TOOL_TYPE_LABELS[tool])),
  ].filter((label): label is string => Boolean(label));
}

export function artifactFromPrompt(prompt: PromptDto): ArtifactItem {
  const title = prompt.name?.trim() || "Untitled artifact";
  const description = prompt.description?.trim() || "No description provided.";
  const author = prompt.authorDisplayName?.trim() || "Unknown author";

  return {
    id: prompt.id,
    title,
    author,
    publishedAt: prompt.createdAt,
    description,
    tools: mapToolTypesToLabels(prompt),
    tags: (prompt.tags ?? [])
      .map((tag) => tag.name)
      .filter(Boolean) as string[],
    favorites: prompt.likesCount,
    isFavorite: false,
    comments: 0,
    updatedAt: prompt.updatedAt ?? prompt.createdAt,
  };
}
