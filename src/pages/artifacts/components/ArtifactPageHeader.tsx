import { Box, Button, Heading, P } from "@veracity/vui";

type ArtifactPageHeaderProps = {
  title: string;
  subtitle: string;
  uploadButtonLabel?: string;
  onUpload?: () => void;
  collectionCount?: number;
  onOpenCollection?: () => void;
};

export default function ArtifactPageHeader({
  title,
  subtitle,
  uploadButtonLabel,
  onUpload,
  collectionCount = 0,
  onOpenCollection,
}: ArtifactPageHeaderProps) {
  const collectionLabel =
    collectionCount > 0 ? `Collection (${collectionCount})` : "Collection";

  return (
    <Box w={1} justifyContent="space-between" alignItems="flex-start" gap={2}>
      <Box column gap={1}>
        <Heading as="h1">{title}</Heading>
        <P color="neutral.textSecondary">{subtitle}</P>
      </Box>
      <Box gap={1} alignItems="center">
        <Button
          variant="tertiaryDark"
          iconLeft="uiFolders"
          onClick={onOpenCollection}
        >
          {collectionLabel}
        </Button>
        {uploadButtonLabel && onUpload ? (
          <Button variant="primaryDark" onClick={onUpload}>
            {uploadButtonLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
