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
  Tag,
  Textarea,
} from "@veracity/vui";
import {
  getMyLikedPromptIds,
  getPagedPrompts,
  likePrompt,
} from "../../api/prompts";
import { getTags } from "../../api/tags";
import { PromptType, ToolType } from "../../api/types";
import { useUserInfo } from "../../auth/authContext";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";
import ArtifactCard from "../../shared/components/ArtifactCard";
import UploadArtifactModal from "../../shared/components/UploadArtifactModal";
import ArtifactDetailsModal from "../../shared/components/ArtifactDetailsModal";
import { useBottomReach } from "../../shared/hooks/useBottomReach";
import { artifactFromPrompt } from "../../shared/utils/artifactFromPrompt";

const TOOL_FILTERS = [
  { label: "All Tools", value: undefined },
  { label: "GitHub Copilot", value: ToolType.Copilot },
  { label: "Claude Code", value: ToolType.Claude },
];
const DEFAULT_TOOL_FILTER_LABEL = "All Tools";
const PAGE_SIZE = 12;

export default function PromptsPage() {
  const userInfo = useUserInfo();
  const queryClient = useQueryClient();
  const [editingPrompt, setEditingPrompt] = useState<{
    title: string;
    description: string;
    content: string;
  } | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [activeToolType, setActiveToolType] = useState<ToolType | undefined>(
    undefined,
  );
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<ArtifactItem | null>(
    null,
  );

  const tagsQuery = useQuery({
    queryKey: ["artifact-tags"],
    queryFn: getTags,
  });

  const likedPromptIdsQuery = useQuery({
    queryKey: ["my-liked-prompt-ids"],
    queryFn: getMyLikedPromptIds,
    enabled: Boolean(userInfo),
    staleTime: 5 * 60 * 1000,
  });

  const likedPromptIds = useMemo(
    () => new Set(likedPromptIdsQuery.data ?? []),
    [likedPromptIdsQuery.data],
  );

  const likePromptMutation = useMutation({
    mutationFn: likePrompt,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-liked-prompt-ids"] }),
        queryClient.invalidateQueries({
          queryKey: ["artifacts", PromptType.Prompt],
        }),
      ]);
    },
  });

  const promptsQuery = useInfiniteQuery({
    queryKey: [
      "artifacts",
      PromptType.Prompt,
      searchValue,
      activeToolType,
      activeTag,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPagedPrompts({
        page: pageParam,
        pageSize: PAGE_SIZE,
        type: PromptType.Prompt,
        search: searchValue.trim() || undefined,
        toolType: activeToolType,
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

  const visiblePrompts = useMemo(
    () =>
      promptsQuery.data?.pages
        .flatMap((page) => page.items ?? [])
        .map((prompt) => artifactFromPrompt(prompt, likedPromptIds)) ?? [],
    [likedPromptIds, promptsQuery.data],
  );

  const handleLikePrompt = (prompt: ArtifactItem) => {
    if (!userInfo || prompt.isFavorite || likePromptMutation.isPending) {
      return;
    }

    likePromptMutation.mutate(prompt.id);
  };

  const promptTags = useMemo(
    () =>
      (tagsQuery.data ?? [])
        .map((tag) => tag.name?.trim())
        .filter((name): name is string => Boolean(name)),
    [tagsQuery.data],
  );

  const promptTagOptions = useMemo(
    () =>
      (tagsQuery.data ?? [])
        .map((tag) => ({ id: tag.id, name: tag.name?.trim() ?? "" }))
        .filter((tag) => Boolean(tag.name)),
    [tagsQuery.data],
  );

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
    if (!promptsQuery.hasNextPage || promptsQuery.isFetchingNextPage) {
      return;
    }

    void promptsQuery.fetchNextPage();
  };

  const loadMoreRef = useBottomReach({
    enabled: Boolean(promptsQuery.hasNextPage),
    onReachBottom: handleLoadMore,
  });

  return (
    <Box column w={1} p={{ xs: 3, md: 4 }} gap={3}>
      <ArtifactPageHeader
        title="Prompts"
        subtitle="Browse high-signal prompt artifacts for architecture, testing, and operations work."
        uploadButtonLabel="+ Upload prompt"
        onUpload={() => setIsUploadModalOpen(true)}
      />

      <ArtifactSearchFiltersCard
        searchId="prompts-search"
        searchLabel="Search prompts"
        searchPlaceholder="Search prompts..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        toolFilters={TOOL_FILTERS.map((toolFilter) => toolFilter.label)}
        activeTool={activeToolLabel}
        onToolChange={handleToolChange}
        tags={promptTags}
        activeTag={activeTag ?? undefined}
        onTagChange={setActiveTag}
      />

      {promptsQuery.isPending ? (
        <Box w={1} justifyContent="center" py={6}>
          <Spinner aria-label="Loading prompts" />
        </Box>
      ) : promptsQuery.isError ? (
        <Box column w={1} gap={2} alignItems="center" py={6}>
          <P color="error.text">Unable to load prompts right now.</P>
          <Button
            variant="secondaryDark"
            onClick={() => void promptsQuery.refetch()}
          >
            Retry
          </Button>
        </Box>
      ) : visiblePrompts.length === 0 ? (
        <Box column w={1} alignItems="center" gap={2} py={6}>
          <P color="neutral.textSecondary">
            No prompts match your filters yet.
          </P>
        </Box>
      ) : (
        <>
          <Grid
            w={1}
            gap={3}
            gridTemplateColumns={{ sm: "1fr", md: "1fr 1fr", lg: "1fr 1fr" }}
          >
            {visiblePrompts.map((prompt) => (
              <ArtifactCard
                key={prompt.id}
                artifact={prompt}
                onLike={handleLikePrompt}
                onViewDetails={setSelectedPrompt}
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
          {promptsQuery.isFetchingNextPage ? (
            <Box w={1} justifyContent="center" py={3}>
              <Spinner aria-label="Loading more prompts" />
            </Box>
          ) : null}
        </>
      )}

      <UploadArtifactModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        artifactType={PromptType.Prompt}
        artifactLabel="Prompt"
        availableTools={TOOL_FILTERS.flatMap((toolFilter) =>
          toolFilter.value
            ? [{ id: toolFilter.value, label: toolFilter.label }]
            : [],
        )}
        availableTags={promptTagOptions}
        onAfterCreate={async ({ mode, artifact }) => {
          await promptsQuery.refetch();

          if (mode === "markdown") {
            setEditingPrompt({
              title: artifact.name?.trim() ?? "",
              description: artifact.description?.trim() ?? "",
              content: artifact.content?.trim() ?? "",
            });
          }
        }}
      />

      <Modal
        isOpen={Boolean(editingPrompt)}
        onClose={() => setEditingPrompt(null)}
        aria-labelledby="prompt-edit-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="prompt-edit-modal-title" as="h2">
            Edit Prompt
          </Heading>

          <Box column gap={1}>
            <Label htmlFor="prompt-edit-title" text="Title" />
            <Input
              id="prompt-edit-title"
              value={editingPrompt?.title ?? ""}
              onChange={(event) =>
                setEditingPrompt((prev) =>
                  prev ? { ...prev, title: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box column gap={1}>
            <Label htmlFor="prompt-edit-description" text="Description" />
            <Textarea
              id="prompt-edit-description"
              rows={3}
              value={editingPrompt?.description ?? ""}
              onChange={(event) =>
                setEditingPrompt((prev) =>
                  prev ? { ...prev, description: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box column gap={1}>
            <Label htmlFor="prompt-edit-content" text="Content" />
            <Textarea
              id="prompt-edit-content"
              rows={6}
              value={editingPrompt?.content ?? ""}
              onChange={(event) =>
                setEditingPrompt((prev) =>
                  prev ? { ...prev, content: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setEditingPrompt(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primaryDark"
              onClick={() => setEditingPrompt(null)}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Modal>

      <ArtifactDetailsModal
        isOpen={Boolean(selectedPrompt)}
        onClose={() => setSelectedPrompt(null)}
        artifactId={selectedPrompt?.id ?? null}
        artifactType={PromptType.Prompt}
        artifactLabel="Prompt"
        onAfterSave={async () => {
          await promptsQuery.refetch();
        }}
      />
    </Box>
  );
}
