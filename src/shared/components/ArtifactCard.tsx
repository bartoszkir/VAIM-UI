import { Box, Button, Card, Heading, P, T, Tag } from "@veracity/vui";
import type { ArtifactItem } from "../types/artifacts";

type ArtifactCardProps = {
  artifact: ArtifactItem;
  onViewDetails: (artifact: ArtifactItem) => void;
  viewDetailsLabel?: string;
};

export default function ArtifactCard({
  artifact,
  onViewDetails,
  viewDetailsLabel = "View details",
}: ArtifactCardProps) {
  return (
    <Card p={{ xs: 3, md: 4 }} column gap={2.5}>
      <Box w={1} justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Heading as="h3">{artifact.title}</Heading>
        <T whiteSpace="nowrap">{artifact.favorites}</T>
      </Box>

      <T color="neutral.textSecondary">
        {artifact.author} | {artifact.publishedDaysAgo} days ago
      </T>

      <P color="neutral.textSecondary">{artifact.description}</P>

      <Box w={1} flexWrap="wrap" gap={1.5}>
        {artifact.tools.map((tool) => (
          <Tag
            key={`${artifact.id}-${tool}`}
            text={tool}
            variant="subtleBlue"
          />
        ))}
      </Box>

      <Box w={1} flexWrap="wrap" gap={1.5}>
        {artifact.tags.map((tag) => (
          <Tag key={`${artifact.id}-${tag}`} text={tag} variant="subtleGrey" />
        ))}
      </Box>

      <Box w={1} justifyContent="space-between" alignItems="center" mt={1}>
        <T color="neutral.textSecondary">{artifact.comments} comments</T>
        <T color="neutral.textSecondary">
          Updated {artifact.updatedDaysAgo} day
          {artifact.updatedDaysAgo > 1 ? "s" : ""} ago
        </T>
      </Box>

      <Box w={1} justifyContent="flex-end" mt={1}>
        <Button variant="tertiaryDark" onClick={() => onViewDetails(artifact)}>
          {viewDetailsLabel}
        </Button>
      </Box>
    </Card>
  );
}
