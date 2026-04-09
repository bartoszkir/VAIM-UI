import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  Textarea,
} from "@veracity/vui";
import {
  getMyLikedPromptIds,
  getPagedPrompts,
  likePrompt,
  unlikePrompt,
} from "../../api/prompts";
import { PromptType, ToolType } from "../../api/types";
import { useUserInfo } from "../../auth/authContext";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactCard from "../../shared/components/ArtifactCard";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";
import UploadArtifactModal from "../../shared/components/UploadArtifactModal";
import ArtifactDetailsModal from "../../shared/components/ArtifactDetailsModal";
import { useArtifactTags } from "../../shared/hooks/useArtifactTags";
import { useBottomReach } from "../../shared/hooks/useBottomReach";
import { artifactFromPrompt } from "../../shared/utils/artifactFromPrompt";

const TOOL_FILTERS = [
  { label: "All Tools", value: undefined },
  { label: "GitHub Copilot", value: ToolType.Copilot },
  { label: "Claude Code", value: ToolType.Claude },
];
const DEFAULT_TOOL_FILTER_LABEL = "All Tools";
const PAGE_SIZE = 12;

export default function InstructionsPage() {
  const userInfo = useUserInfo();
  const queryClient = useQueryClient();
  const [editingInstruction, setEditingInstruction] = useState<{
    title: string;
    description: string;
    content: string;
  } | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [activeToolType, setActiveToolType] = useState<ToolType | undefined>(
    undefined,
  );
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedInstruction, setSelectedInstruction] =
    useState<ArtifactItem | null>(null);
  const { tags, tagsById } = useArtifactTags();

  const likedPromptIdsQuery = useQuery({
    queryKey: ["my-liked-prompt-ids"],
    queryFn: getMyLikedPromptIds,
    enabled: Boolean(userInfo),
    staleTime: 5 * 60 * 1000,
  });

  const likedPromptIds = useMemo(
    () => new Set((likedPromptIdsQuery.data ?? []) as string[]),
    [likedPromptIdsQuery.data],
  );

  const likePromptMutation = useMutation({
    mutationFn: likePrompt,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-liked-prompt-ids"] }),
        queryClient.invalidateQueries({
          queryKey: ["artifacts", PromptType.Instruction],
        }),
      ]);
    },
  });

  const unlikePromptMutation = useMutation({
    mutationFn: unlikePrompt,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-liked-prompt-ids"] }),
        queryClient.invalidateQueries({
          queryKey: ["artifacts", PromptType.Instruction],
        }),
      ]);
    },
  });

  const instructionsQuery = useInfiniteQuery({
    queryKey: [
      "artifacts",
      PromptType.Instruction,
      searchValue,
      activeToolType,
      activeTagIds,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPagedPrompts({
        page: pageParam,
        pageSize: PAGE_SIZE,
        type: PromptType.Instruction,
        search: searchValue.trim() || undefined,
        toolType: activeToolType,
        tagIds: activeTagIds.length > 0 ? activeTagIds : undefined,
        tag:
          activeTagIds.length > 0
            ? activeTagIds
                .map((tagId) => tagsById.get(tagId))
                .filter((tagName): tagName is string => Boolean(tagName))
            : undefined,
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
        .map((instruction) =>
          artifactFromPrompt(instruction, likedPromptIds),
        ) ?? [],
    [instructionsQuery.data, likedPromptIds],
  );

  const handleLikeInstruction = (instruction: ArtifactItem) => {
    if (
      !userInfo ||
      likePromptMutation.isPending ||
      unlikePromptMutation.isPending
    ) {
      return;
    }

    if (instruction.isFavorite) {
      unlikePromptMutation.mutate(instruction.id);
      return;
    }

    likePromptMutation.mutate(instruction.id);
  };

  const instructionTagOptions = useMemo(
    () => tags.map((tag) => ({ id: tag.id, name: tag.name })),
    [tags],
  );

  const handleTagChange = (tagId: string) => {
    setActiveTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((value) => value !== tagId)
        : [...prev, tagId],
    );
  };

  const activeToolLabel =
    TOOL_FILTERS.find((toolFilter) => toolFilter.value === activeToolType)
      ?.label ?? DEFAULT_TOOL_FILTER_LABEL;

  const handleToolChange = (selectedToolLabel: string) => {
    const selectedToolType = TOOL_FILTERS.find(
      (toolFilter) => toolFilter.label === selectedToolLabel,
    )?.value;

    setActiveToolType(selectedToolType);
  };

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
        toolFilters={TOOL_FILTERS.map((toolFilter) => toolFilter.label)}
        activeTool={activeToolLabel}
        onToolChange={handleToolChange}
        tags={tags}
        activeTagIds={activeTagIds}
        onTagChange={handleTagChange}
        onClearTags={() => setActiveTagIds([])}
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
                onLike={handleLikeInstruction}
                onViewDetails={setSelectedInstruction}
              />
            ))}
          </Grid>

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
        availableTools={TOOL_FILTERS.flatMap((toolFilter) =>
          toolFilter.value
            ? [{ id: toolFilter.value, label: toolFilter.label }]
            : [],
        )}
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

      <ArtifactDetailsModal
        isOpen={Boolean(selectedInstruction)}
        onClose={() => setSelectedInstruction(null)}
        artifactId={selectedInstruction?.id ?? null}
        artifactType={PromptType.Instruction}
        artifactLabel="Instruction"
        onAfterSave={async () => {
          await instructionsQuery.refetch();
        }}
      />
    </Box>
  );
}
