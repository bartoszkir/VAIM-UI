import { Box, Button, Heading, P } from "@veracity/vui";

type ArtifactPageHeaderProps = {
  title: string;
  subtitle: string;
  uploadButtonLabel: string;
  onUpload: () => void;
};

export default function ArtifactPageHeader({
  title,
  subtitle,
  uploadButtonLabel,
  onUpload,
}: ArtifactPageHeaderProps) {
  return (
    <Box w={1} justifyContent="space-between" alignItems="flex-start" gap={2}>
      <Box column gap={1}>
        <Heading as="h1">{title}</Heading>
        <P color="neutral.textSecondary">{subtitle}</P>
      </Box>
      <Button variant="primaryDark" onClick={onUpload}>
        {uploadButtonLabel}
      </Button>
    </Box>
  );
}
