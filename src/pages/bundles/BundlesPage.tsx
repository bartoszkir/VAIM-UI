import { useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  Grid,
  Label,
  P,
  Spinner,
  Textarea,
} from "@veracity/vui";
import { generateDynamicBundle, getPagedBundles } from "../../api/bundles";
import BundlePageHeader from "./components/BundlePageHeader";
import BundleCard from "./components/BundleCard";
import BundleSearchFiltersCard from "./components/BundleSearchFiltersCard";
import { useBottomReach } from "../../shared/hooks/useBottomReach";
import { bundleFromDto } from "../../shared/utils/bundleFromDto";
import { useModal } from "../../shared/modals/ModalContext";

const PAGE_SIZE = 12;

export default function BundlesPage() {
  const queryClient = useQueryClient();

  const [searchValue, setSearchValue] = useState("");
  const [dynamicPromptValue, setDynamicPromptValue] = useState("");
  const [isGeneratingDynamicBundle, setIsGeneratingDynamicBundle] =
    useState(false);
  const { openBundleDetails } = useModal();

  const bundlesQuery = useInfiniteQuery({
    queryKey: ["bundles", searchValue],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPagedBundles({
        page: pageParam,
        pageSize: PAGE_SIZE,
        search: searchValue.trim() || undefined,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (sum, page) => sum + (page.items?.length ?? 0),
        0,
      );

      if (loadedCount >= lastPage.totalCount) {
        return undefined;
      }

      return lastPage.page + 1;
    },
  });

  const visibleBundles = useMemo(
    () =>
      bundlesQuery.data?.pages
        .flatMap((page) => page.items ?? [])
        .map(bundleFromDto) ?? [],
    [bundlesQuery.data],
  );

  const handleLoadMore = () => {
    if (!bundlesQuery.hasNextPage || bundlesQuery.isFetchingNextPage) {
      return;
    }

    void bundlesQuery.fetchNextPage();
  };

  const loadMoreRef = useBottomReach({
    enabled: Boolean(bundlesQuery.hasNextPage),
    onReachBottom: handleLoadMore,
  });

  const handleGenerateDynamicBundle = async () => {
    if (!dynamicPromptValue.trim() || isGeneratingDynamicBundle) {
      return;
    }

    setIsGeneratingDynamicBundle(true);

    try {
      const dynamicBundle = await generateDynamicBundle({
        prompt: dynamicPromptValue.trim(),
      });

      await queryClient.invalidateQueries({ queryKey: ["bundles"] });
      openBundleDetails({ preloadedBundle: dynamicBundle });
    } finally {
      setIsGeneratingDynamicBundle(false);
    }
  };

  return (
    <Box column w={1} p={{ xs: 3, md: 4 }} gap={3}>
      <BundlePageHeader
        title="Bundles"
        subtitle="Build dynamic bundles from business prompts and manage reusable static bundles."
      />

      <Card w={1} p={{ xs: 3, md: 4 }} column gap={3}>
        <Box column gap={1}>
          <Label
            htmlFor="dynamic-bundle-prompt"
            text="Describe your business need"
          />
          <Textarea
            id="dynamic-bundle-prompt"
            rows={4}
            value={dynamicPromptValue}
            onChange={(event) => setDynamicPromptValue(event.target.value)}
            placeholder="Example: Build a secure onboarding bundle for frontend and API teams, including testing and documentation artifacts."
          />
          <P color="neutral.textSecondary">
            Dynamic bundle previews are generated instantly and can be converted
            to static bundles.
          </P>
        </Box>

        <Box w={1} justifyContent="flex-end">
          <Button
            variant="primaryDark"
            onClick={() => void handleGenerateDynamicBundle()}
            disabled={!dynamicPromptValue.trim() || isGeneratingDynamicBundle}
          >
            {isGeneratingDynamicBundle
              ? "Generating dynamic bundle..."
              : "Generate dynamic bundle"}
          </Button>
        </Box>
      </Card>

      <BundleSearchFiltersCard
        searchId="bundles-search"
        searchLabel="Search bundles"
        searchPlaceholder="Search bundles..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      {bundlesQuery.isPending ? (
        <Box w={1} justifyContent="center" py={6}>
          <Spinner aria-label="Loading bundles" />
        </Box>
      ) : bundlesQuery.isError ? (
        <Box column w={1} gap={2} alignItems="center" py={6}>
          <P color="error.text">Unable to load bundles right now.</P>
          <Button
            variant="secondaryDark"
            onClick={() => void bundlesQuery.refetch()}
          >
            Retry
          </Button>
        </Box>
      ) : visibleBundles.length === 0 ? (
        <Box column w={1} alignItems="center" gap={2} py={6}>
          <P color="neutral.textSecondary">
            No bundles match your filters yet.
          </P>
        </Box>
      ) : (
        <>
          <Grid
            w={1}
            gap={3}
            gridTemplateColumns={{ sm: "1fr", md: "1fr 1fr", lg: "1fr 1fr" }}
          >
            {visibleBundles.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </Grid>

          <div ref={loadMoreRef} />
          {bundlesQuery.isFetchingNextPage ? (
            <Box w={1} justifyContent="center" py={3}>
              <Spinner aria-label="Loading more bundles" />
            </Box>
          ) : null}
        </>
      )}
    </Box>
  );
}
