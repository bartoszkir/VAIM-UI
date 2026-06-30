import { Box, Button, Card, Heading, Link, P, T, Tag } from "@veracity/vui";
import { ModerationStatus } from "../../../api/types";
import type { ArtifactItem } from "../../../shared/types/artifacts";
import { relativeTime } from "../../../shared/utils/relativeTime";
import { useModal } from "../../../shared/modals/ModalContext";

type ModerationDisplay = {
  label: string;
  variant:
    | "subtleYellow"
    | "subtleGreen"
    | "subtleRed"
    | "subtleGrey"
    | "subtleBlue";
};

const MODERATION_DISPLAY: Record<ModerationStatus, ModerationDisplay> = {
  [ModerationStatus.Pending]: {
    label: "Pending review",
    variant: "subtleYellow",
  },
  [ModerationStatus.Approved]: { label: "Approved", variant: "subtleGreen" },
  [ModerationStatus.Rejected]: { label: "Rejected", variant: "subtleRed" },
  [ModerationStatus.Flagged]: { label: "Flagged", variant: "subtleRed" },
  [ModerationStatus.Removed]: { label: "Removed", variant: "subtleGrey" },
};

type ArtifactCardProps = {
  artifact: ArtifactItem;
  onLike?: (artifact: ArtifactItem) => void;
  viewDetailsLabel?: string;
  isInCollection?: boolean;
  onToggleCollection?: (artifactId: string) => void;
};

export default function ArtifactCard({
  artifact,
  onLike,
  viewDetailsLabel = "View details",
  isInCollection = false,
  onToggleCollection,
}: ArtifactCardProps) {
  const { openArtifactDetails } = useModal();

  const moderation = MODERATION_DISPLAY[artifact.moderationStatus] ?? {
    label: "Synchronized",
    variant: "subtleBlue",
  };

  return (
    <Card p={{ xs: 3, md: 4 }} column gap={2.5}>
      <Box
        w={1}
        flexWrap="wrap"
        justifyContent="space-between"
        alignItems="center"
        gap={1.5}
      >
        <Heading as="h3">{artifact.title}</Heading>
        <Box gap={1}>
          <Button
            isRound
            variant={isInCollection ? "primaryDark" : "tertiaryDark"}
            size="sm"
            icon={isInCollection ? "uiFolderCheck" : "uiFolderPlus"}
            aria-label={
              isInCollection ? "Remove from Collection" : "Add to Collection"
            }
            onClick={() => onToggleCollection?.(artifact.id)}
          />
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
      <Box w={1} alignItems="center" gap={2}>
        <T color="neutral.textSecondary">
          {artifact.author} | {relativeTime(artifact.publishedAt)}
        </T>
        <Box alignItems="center" gap={1}>
          <Tag text={moderation.label} variant={moderation.variant} />
          {artifact.hasPendingPr ? (
            artifact.prUrl ? (
              <Link href={artifact.prUrl} isExternal iconRight="uiExternalLink">
                Pending pull request
              </Link>
            ) : (
              <Tag text="Pending pull request" variant="subtleYellow" />
            )
          ) : null}
        </Box>
      </Box>

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
        <Box gap={2}>
          <T color="neutral.textSecondary">{artifact.comments} comments</T>
          <T color="neutral.textSecondary">
            Updated {relativeTime(artifact.updatedAt)}
          </T>
        </Box>
        <Button
          variant="tertiaryDark"
          onClick={() =>
            openArtifactDetails({
              artifactId: artifact.id,
              artifactType: artifact.type,
            })
          }
        >
          {viewDetailsLabel}
        </Button>
      </Box>
    </Card>
  );
}
