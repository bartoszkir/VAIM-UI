import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Grid,
  Heading,
  Modal,
  P,
  Spinner,
  Tag,
} from "@veracity/vui";
import { getPagedPrompts } from "../../api/prompts";
import { getTags } from "../../api/tags";
import { PromptType } from "../../api/types";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactCard from "../../shared/components/ArtifactCard";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";
import { useBottomReach } from "../../shared/hooks/useBottomReach";
import { artifactFromPrompt } from "../../shared/utils/artifactFromPrompt";

const TOOL_FILTERS = ["All Tools", "GitHub Copilot", "Claude Code"];
const PAGE_SIZE = 12;

export default function InstructionsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [activeTool, setActiveTool] = useState(TOOL_FILTERS[0]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedInstruction, setSelectedInstruction] =
    useState<ArtifactItem | null>(null);

  const tagsQuery = useQuery({
    queryKey: ["artifact-tags"],
    queryFn: getTags,
  });

  const instructionsQuery = useInfiniteQuery({
    queryKey: [
      "artifacts",
      PromptType.Instruction,
      searchValue,
      activeTool,
      activeTag,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPagedPrompts({
        page: pageParam,
        pageSize: PAGE_SIZE,
        type: PromptType.Instruction,
        search: searchValue.trim() || undefined,
        tool: activeTool === "All Tools" ? undefined : activeTool,
        tag: activeTag ?? undefined,
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

  const visibleInstructions = useMemo(
    () =>
      instructionsQuery.data?.pages
        .flatMap((page) => page.items ?? [])
        .map(artifactFromPrompt) ?? [],
    [instructionsQuery.data],
  );

  const instructionTags = useMemo(
    () =>
      (tagsQuery.data ?? [])
        .map((tag) => tag.name?.trim())
        .filter((name): name is string => Boolean(name)),
    [tagsQuery.data],
  );

  const handleLoadMore = () => {
    if (
      !instructionsQuery.hasNextPage ||
      instructionsQuery.isFetchingNextPage
    ) {
      return;
    }

    void instructionsQuery.fetchNextPage();
  };

  const loadMoreRef = useBottomReach({
    enabled: Boolean(instructionsQuery.hasNextPage),
    onReachBottom: handleLoadMore,
  });

  return (
    <Box column w={1} p={{ xs: 3, md: 4 }} gap={3}>
      <ArtifactPageHeader
        title="Instructions"
        subtitle="Use instruction artifacts to standardize implementation, review, and release workflows."
        uploadButtonLabel="+ Upload instruction"
        onUpload={() => setIsUploadModalOpen(true)}
      />

      <ArtifactSearchFiltersCard
        searchId="instructions-search"
        searchLabel="Search instructions"
        searchPlaceholder="Search instructions..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        toolFilters={TOOL_FILTERS}
        activeTool={activeTool}
        onToolChange={setActiveTool}
        tags={instructionTags}
        activeTag={activeTag ?? undefined}
        onTagChange={setActiveTag}
      />

      {instructionsQuery.isPending ? (
        <Box w={1} justifyContent="center" py={6}>
          <Spinner aria-label="Loading instructions" />
        </Box>
      ) : instructionsQuery.isError ? (
        <Box column w={1} gap={2} alignItems="center" py={6}>
          <P color="error.text">Unable to load instructions right now.</P>
          <Button
            variant="secondaryDark"
            onClick={() => void instructionsQuery.refetch()}
          >
            Retry
          </Button>
        </Box>
      ) : visibleInstructions.length === 0 ? (
        <Box column w={1} alignItems="center" gap={2} py={6}>
          <P color="neutral.textSecondary">
            No instructions match your filters yet.
          </P>
        </Box>
      ) : (
        <>
          <Grid
            w={1}
            gap={3}
            gridTemplateColumns={{ sm: "1fr", md: "1fr 1fr", lg: "1fr 1fr" }}
          >
            {visibleInstructions.map((instruction) => (
              <ArtifactCard
                key={instruction.id}
                artifact={instruction}
                onViewDetails={setSelectedInstruction}
              />
            ))}
          </Grid>

          {activeTag ? (
            <Box w={1} alignItems="center" gap={2}>
              <P color="neutral.textSecondary">Filtering by tag:</P>
              <Tag
                text={activeTag}
                variant="subtleBlue"
                isInteractive
                onClick={() => setActiveTag(null)}
              />
            </Box>
          ) : null}

          <div ref={loadMoreRef} />
          {instructionsQuery.isFetchingNextPage ? (
            <Box w={1} justifyContent="center" py={3}>
              <Spinner aria-label="Loading more instructions" />
            </Box>
          ) : null}
        </>
      )}

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        aria-labelledby="upload-instruction-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="upload-instruction-modal-title" as="h2">
            Upload Instruction
          </Heading>
          <P>Upload flow is coming next for reusable instruction artifacts.</P>
          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal
        isOpen={Boolean(selectedInstruction)}
        onClose={() => setSelectedInstruction(null)}
        aria-labelledby="instruction-detail-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="instruction-detail-modal-title" as="h2">
            {selectedInstruction?.title ?? "Instruction Details"}
          </Heading>
          <P>
            Detailed instruction content will be connected in the next step.
            This placeholder is wired to the selected card.
          </P>
          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setSelectedInstruction(null)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
