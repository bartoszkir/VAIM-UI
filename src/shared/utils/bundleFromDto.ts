import { PromptType, ToolType } from "../../api/types";
import type { BundleArtifactDto, BundleDto } from "../../api/types";
import type { BundleArtifactItem, BundleItem } from "../types/bundles";

const TOOL_TYPE_LABELS: Record<number, string> = {
  [ToolType.Copilot]: "GitHub Copilot",
  [ToolType.Claude]: "Claude Code",
};

const PROMPT_TYPE_LABELS: Record<number, string> = {
  [PromptType.Prompt]: "Prompt",
  [PromptType.Instruction]: "Instruction",
  [PromptType.Skill]: "Skill",
};

function mapTools(toolTypes?: ToolType[] | null): string[] {
  if (!toolTypes || toolTypes.length === 0) {
    return [];
  }

  return [
    ...new Set(toolTypes.map((toolType) => TOOL_TYPE_LABELS[toolType])),
  ].filter((label): label is string => Boolean(label));
}

function toArtifactItem(artifact: BundleArtifactDto): BundleArtifactItem {
  return {
    id: artifact.id,
    title: artifact.name?.trim() || "Untitled artifact",
    description: artifact.description?.trim() || "No description provided.",
    typeLabel: PROMPT_TYPE_LABELS[artifact.type] || "Artifact",
    tools: mapTools(artifact.toolTypes),
    tags: (artifact.tags ?? [])
      .map((tag) => tag.name?.trim())
      .filter((value): value is string => Boolean(value)),
  };
}

export function bundleFromDto(bundle: BundleDto): BundleItem {
  const artifacts = (bundle.artifacts ?? []).map(toArtifactItem);

  return {
    id: bundle.id,
    title: bundle.name?.trim() || "Untitled bundle",
    description: bundle.description?.trim() || "No description provided.",
    author: bundle.authorDisplayName?.trim() || "Unknown author",
    publishedAt: bundle.createdAt,
    updatedAt: bundle.updatedAt ?? bundle.createdAt,
    tools: mapTools(bundle.toolTypes),
    tags: (bundle.tags ?? [])
      .map((tag) => tag.name?.trim())
      .filter((value): value is string => Boolean(value)),
    artifactCount: artifacts.length,
    artifacts,
    isDynamic: bundle.isDynamic,
  };
}
