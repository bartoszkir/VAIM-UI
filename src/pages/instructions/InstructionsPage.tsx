import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Grid,
  Heading,
  Input,
  Label,
  Modal,
  P,
  Spinner,
  Tag,
  Textarea,
} from "@veracity/vui";
import { getPagedPrompts } from "../../api/prompts";
import { getTags } from "../../api/tags";
import { PromptType } from "../../api/types";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactCard from "../../shared/components/ArtifactCard";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";
import UploadArtifactModal from "../../shared/components/UploadArtifactModal";
import { useBottomReach } from "../../shared/hooks/useBottomReach";
import { artifactFromPrompt } from "../../shared/utils/artifactFromPrompt";

const TOOL_FILTERS = ["All Tools", "GitHub Copilot", "Claude Code"];
const PAGE_SIZE = 12;

export default function InstructionsPage() {
  const [editingInstruction, setEditingInstruction] = useState<{
    title: string;
    description: string;
    content: string;
  } | null>(null);
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

  const instructionTagOptions = useMemo(
    () =>
      (tagsQuery.data ?? [])
        .map((tag) => ({ id: tag.id, name: tag.name?.trim() ?? "" }))
        .filter((tag) => Boolean(tag.name)),
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

      <UploadArtifactModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        artifactType={PromptType.Instruction}
        artifactLabel="Instruction"
        availableTools={TOOL_FILTERS.filter((tool) => tool !== "All Tools")}
        availableTags={instructionTagOptions}
        onAfterCreate={async ({ mode, artifact }) => {
          await instructionsQuery.refetch();

          if (mode === "markdown") {
            setEditingInstruction({
              title: artifact.name?.trim() ?? "",
              description: artifact.description?.trim() ?? "",
              content: artifact.content?.trim() ?? "",
            });
          }
        }}
      />

      <Modal
        isOpen={Boolean(editingInstruction)}
        onClose={() => setEditingInstruction(null)}
        aria-labelledby="instruction-edit-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="instruction-edit-modal-title" as="h2">
            Edit Instruction
          </Heading>

          <Box column gap={1}>
            <Label htmlFor="instruction-edit-title" text="Title" />
            <Input
              id="instruction-edit-title"
              value={editingInstruction?.title ?? ""}
              onChange={(event) =>
                setEditingInstruction((prev) =>
                  prev ? { ...prev, title: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box column gap={1}>
            <Label htmlFor="instruction-edit-description" text="Description" />
            <Textarea
              id="instruction-edit-description"
              rows={3}
              value={editingInstruction?.description ?? ""}
              onChange={(event) =>
                setEditingInstruction((prev) =>
                  prev ? { ...prev, description: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box column gap={1}>
            <Label htmlFor="instruction-edit-content" text="Content" />
            <Textarea
              id="instruction-edit-content"
              rows={6}
              value={editingInstruction?.content ?? ""}
              onChange={(event) =>
                setEditingInstruction((prev) =>
                  prev ? { ...prev, content: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setEditingInstruction(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primaryDark"
              onClick={() => setEditingInstruction(null)}
            >
              Save
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
