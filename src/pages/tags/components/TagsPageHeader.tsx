import { Box, Heading, P } from "@veracity/vui";

type TagsPageHeaderProps = {
  title: string;
  subtitle: string;
};

export default function TagsPageHeader({
  title,
  subtitle,
}: TagsPageHeaderProps) {
  return (
    <Box w={1} justifyContent="space-between" alignItems="flex-start" gap={2}>
      <Box column gap={1}>
        <Heading as="h1">{title}</Heading>
        <P color="neutral.textSecondary">{subtitle}</P>
      </Box>
    </Box>
  );
}
