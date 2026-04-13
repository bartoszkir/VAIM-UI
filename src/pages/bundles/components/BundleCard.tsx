import { Box, Button, Card, Heading, P, T, Tag } from "@veracity/vui";
import type { BundleItem } from "../../../shared/types/bundles";
import { relativeTime } from "../../../shared/utils/relativeTime";

type BundleCardProps = {
  bundle: BundleItem;
  onViewDetails: (bundle: BundleItem) => void;
};

export default function BundleCard({ bundle, onViewDetails }: BundleCardProps) {
  return (
    <Card p={{ xs: 3, md: 4 }} column gap={2.5}>
      <Box w={1} justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Heading as="h3">{bundle.title}</Heading>
        {bundle.isDynamic ? <Tag text="Dynamic" variant="subtleBlue" /> : null}
      </Box>

      <T color="neutral.textSecondary">
        {bundle.author} | {relativeTime(bundle.publishedAt)}
      </T>

      <P color="neutral.textSecondary">{bundle.description}</P>

      <Box column gap={1}>
        <T fontWeight="semibold">Artifacts ({bundle.artifactCount})</T>
        <Box w={1} flexWrap="wrap" gap={1}>
          {bundle.artifacts.slice(0, 4).map((artifact) => (
            <Tag
              key={`${bundle.id}-${artifact.id}`}
              text={artifact.title}
              variant="subtleGrey"
            />
          ))}
          {bundle.artifactCount > 4 ? (
            <Tag
              text={`+${bundle.artifactCount - 4} more`}
              variant="subtleGrey"
            />
          ) : null}
        </Box>
      </Box>

      {bundle.tools.length > 0 ? (
        <Box w={1} flexWrap="wrap" gap={1.5}>
          {bundle.tools.map((tool) => (
            <Tag
              key={`${bundle.id}-${tool}`}
              text={tool}
              variant="subtleBlue"
            />
          ))}
        </Box>
      ) : null}

      {bundle.tags.length > 0 ? (
        <Box w={1} flexWrap="wrap" gap={1.5}>
          {bundle.tags.map((tag) => (
            <Tag key={`${bundle.id}-${tag}`} text={tag} variant="subtleGrey" />
          ))}
        </Box>
      ) : null}

      <Box w={1} justifyContent="space-between" alignItems="center" mt={1}>
        <T color="neutral.textSecondary">
          Updated {relativeTime(bundle.updatedAt)}
        </T>
      </Box>

      <Box w={1} justifyContent="flex-end" mt={1}>
        <Button variant="tertiaryDark" onClick={() => onViewDetails(bundle)}>
          View details
        </Button>
      </Box>
    </Card>
  );
}
