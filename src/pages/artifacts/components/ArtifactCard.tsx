import { Box, Button, Card, Checkbox, Heading, P, T, Tag } from "@veracity/vui";
import type { ArtifactItem } from "../../../shared/types/artifacts";
import { relativeTime } from "../../../shared/utils/relativeTime";

type ArtifactCardProps = {
  artifact: ArtifactItem;
  onViewDetails: (artifact: ArtifactItem) => void;
  onLike?: (artifact: ArtifactItem) => void;
  viewDetailsLabel?: string;
  isInCollection?: boolean;
  onToggleCollection?: (artifactId: string) => void;
};

export default function ArtifactCard({
  artifact,
  onViewDetails,
  onLike,
  viewDetailsLabel = "View details",
  isInCollection = false,
  onToggleCollection,
}: ArtifactCardProps) {
  return (
    <Card p={{ xs: 3, md: 4 }} column gap={2.5}>
      <Box w={1} justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Heading as="h3">{artifact.title}</Heading>
        <Box gap={1}>
          <Button
            isRound
            variant={artifact.isFavorite ? "primaryDark" : "tertiaryDark"}
            size="sm"
            iconLeft="uiThumbsUp"
            onClick={() => onLike?.(artifact)}
          >
            {artifact.favorites}
          </Button>
        </Box>
      </Box>

      <T color="neutral.textSecondary">
        {artifact.author} | {relativeTime(artifact.publishedAt)}
      </T>

      <P color="neutral.textSecondary">{artifact.description}</P>

      {artifact.tools.length > 0 ? (
        <Box w={1} flexWrap="wrap" gap={1.5}>
          {artifact.tools.map((tool) => (
            <Tag
              key={`${artifact.id}-${tool}`}
              text={tool}
              variant="subtleBlue"
            />
          ))}
        </Box>
      ) : null}

      {artifact.tags.length > 0 ? (
        <Box w={1} flexWrap="wrap" gap={1.5}>
          {artifact.tags.map((tag) => (
            <Tag
              key={`${artifact.id}-${tag}`}
              text={tag}
              variant="subtleGrey"
            />
          ))}
        </Box>
      ) : null}

      <Box w={1} justifyContent="space-between" alignItems="center" mt={1}>
        <Checkbox
          checked={isInCollection}
          onChange={() => onToggleCollection?.(artifact.id)}
          label="Add to Collection"
          id={`collection-${artifact.id}`}
        />
        <Box gap={2}>
          <T color="neutral.textSecondary">{artifact.comments} comments</T>
          <T color="neutral.textSecondary">
            Updated {relativeTime(artifact.updatedAt)}
          </T>
        </Box>
      </Box>

      <Box w={1} justifyContent="flex-end" mt={1}>
        <Button variant="tertiaryDark" onClick={() => onViewDetails(artifact)}>
          {viewDetailsLabel}
        </Button>
      </Box>
    </Card>
  );
}
