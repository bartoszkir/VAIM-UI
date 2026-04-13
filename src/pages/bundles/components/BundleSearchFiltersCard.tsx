import { Box, Card, Input, Label, T, Tag } from "@veracity/vui";
import type { ArtifactTagOption } from "../../../shared/hooks/useArtifactTags";

type BundleSearchFiltersCardProps = {
  searchId: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  toolFilters?: string[];
  activeTool?: string;
  onToolChange?: (tool: string) => void;
  tags?: ArtifactTagOption[];
  activeTagIds?: string[];
  onTagChange?: (tagId: string) => void;
  onClearTags?: () => void;
};

export default function BundleSearchFiltersCard({
  searchId,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  toolFilters,
  activeTool,
  onToolChange,
  tags,
  activeTagIds,
  onTagChange,
  onClearTags,
}: BundleSearchFiltersCardProps) {
  const selectedTagIds = activeTagIds ?? [];

  return (
    <Card w={1} p={{ xs: 3, md: 4 }} column gap={3}>
      <Box column gap={1}>
        <Label htmlFor={searchId}>{searchLabel}</Label>
        <Input
          id={searchId}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </Box>

      {toolFilters && toolFilters.length > 0 ? (
        <Box column gap={1.5}>
          <T fontWeight="semibold">AI Tool</T>
          <Box w={1} flexWrap="wrap" gap={1.5}>
            {toolFilters.map((tool) => (
              <Tag
                key={tool}
                text={tool}
                isInteractive={Boolean(onToolChange)}
                onClick={onToolChange ? () => onToolChange(tool) : undefined}
                variant={tool === activeTool ? "subtleBlue" : "subtleGrey"}
              />
            ))}
          </Box>
        </Box>
      ) : null}

      {tags && tags.length > 0 ? (
        <Box column gap={1.5}>
          <Box w={1} justifyContent="space-between" alignItems="center">
            <T fontWeight="semibold">Tags</T>
            {selectedTagIds.length > 0 && onClearTags ? (
              <Tag
                text="Clear tags"
                variant="subtleGrey"
                isInteractive
                onClick={onClearTags}
              />
            ) : null}
          </Box>

          <Box w={1} flexWrap="wrap" gap={1.5}>
            {tags.map((tag) => (
              <Tag
                key={tag.id}
                text={tag.name}
                isInteractive={Boolean(onTagChange)}
                onClick={onTagChange ? () => onTagChange(tag.id) : undefined}
                variant={
                  selectedTagIds.includes(tag.id) ? "subtleBlue" : "subtleGrey"
                }
              />
            ))}
          </Box>
        </Box>
      ) : null}
    </Card>
  );
}
