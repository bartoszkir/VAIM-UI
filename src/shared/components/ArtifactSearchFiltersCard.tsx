import { Box, Card, Input, Label, T, Tag } from "@veracity/vui";

type ArtifactSearchFiltersCardProps = {
  searchId: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  toolFilters?: string[];
  activeTool?: string;
  tags?: string[];
};

export default function ArtifactSearchFiltersCard({
  searchId,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  toolFilters,
  activeTool,
  tags,
}: ArtifactSearchFiltersCardProps) {
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
                variant={tool === activeTool ? "subtleBlue" : "subtleGrey"}
              />
            ))}
          </Box>
        </Box>
      ) : null}

      {tags && tags.length > 0 ? (
        <Box column gap={1.5}>
          <T fontWeight="semibold">Tags</T>
          <Box w={1} flexWrap="wrap" gap={1.5}>
            {tags.map((tag) => (
              <Tag key={tag} text={tag} variant="subtleGrey" />
            ))}
          </Box>
        </Box>
      ) : null}
    </Card>
  );
}
