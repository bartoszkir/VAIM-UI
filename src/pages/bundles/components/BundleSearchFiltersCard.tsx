import { Box, Card, Input, Label } from "@veracity/vui";

type BundleSearchFiltersCardProps = {
  searchId: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export default function BundleSearchFiltersCard({
  searchId,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: BundleSearchFiltersCardProps) {
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
    </Card>
  );
}
