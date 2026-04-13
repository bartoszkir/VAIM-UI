import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Box, Grid, P, Button, Spinner } from "@veracity/vui";
import {
  getMyLikedPromptIds,
  getPagedPrompts,
  likePrompt,
  unlikePrompt,
} from "../../api/prompts";
import { PromptType, ToolType } from "../../api/types";
import { useUserInfo } from "../../auth/authContext";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactCard from "../../shared/components/ArtifactCard";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
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

const ARTIFACT_TYPE_FILTERS = [
  { label: "All", value: undefined },
  { label: "Skill", value: PromptType.Skill },
  { label: "Prompt", value: PromptType.Prompt },
  { label: "Instruction", value: PromptType.Instruction },
];

const UPLOAD_ARTIFACT_TYPE_OPTIONS = ARTIFACT_TYPE_FILTERS.flatMap(
  (typeFilter) =>
    typeFilter.value ? [{ id: typeFilter.value, label: typeFilter.label }] : [],
);

const DEFAULT_TOOL_FILTER_LABEL = "All Tools";
const DEFAULT_ARTIFACT_TYPE_LABEL = "All";
const PAGE_SIZE = 12;

function getArtifactLabelByType(type: PromptType): string {
  if (type === PromptType.Skill) {
    return "Skill";
  }

  if (type === PromptType.Prompt) {
    return "Prompt";
  }

  return "Instruction";
}

export default function ArtifactsPage() {
  const userInfo = useUserInfo();
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [activeToolType, setActiveToolType] = useState<ToolType | undefined>(
    undefined,
  );
  const [activeArtifactType, setActiveArtifactType] = useState<
    PromptType | undefined
  >(undefined);
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(
    null,
  );
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
        queryClient.invalidateQueries({ queryKey: ["artifacts"] }),
      ]);
    },
  });

  const unlikePromptMutation = useMutation({
    mutationFn: unlikePrompt,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-liked-prompt-ids"] }),
        queryClient.invalidateQueries({ queryKey: ["artifacts"] }),
      ]);
    },
  });

  const artifactsQuery = useInfiniteQuery({
    queryKey: [
      "artifacts",
      activeArtifactType,
      searchValue,
      activeToolType,
      activeTagIds,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPagedPrompts({
        page: pageParam,
        pageSize: PAGE_SIZE,
        type: activeArtifactType,
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

  const visibleArtifacts = useMemo(
    () =>
      artifactsQuery.data?.pages
        .flatMap((page) => page.items ?? [])
        .map((artifact) => artifactFromPrompt(artifact, likedPromptIds)) ?? [],
    [artifactsQuery.data, likedPromptIds],
  );

  const handleLikeArtifact = (artifact: ArtifactItem) => {
    if (
      !userInfo ||
      likePromptMutation.isPending ||
      unlikePromptMutation.isPending
    ) {
      return;
    }

    if (artifact.isFavorite) {
      unlikePromptMutation.mutate(artifact.id);
      return;
    }

    likePromptMutation.mutate(artifact.id);
  };

  const artifactTagOptions = useMemo(
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

  const activeArtifactTypeLabel =
    ARTIFACT_TYPE_FILTERS.find(
      (typeFilter) => typeFilter.value === activeArtifactType,
    )?.label ?? DEFAULT_ARTIFACT_TYPE_LABEL;

  const handleArtifactTypeChange = (selectedTypeLabel: string) => {
    const selectedType = ARTIFACT_TYPE_FILTERS.find(
      (typeFilter) => typeFilter.label === selectedTypeLabel,
    )?.value;

    setActiveArtifactType(selectedType);
  };

  const handleLoadMore = () => {
    if (!artifactsQuery.hasNextPage || artifactsQuery.isFetchingNextPage) {
      return;
    }

    void artifactsQuery.fetchNextPage();
  };

  const loadMoreRef = useBottomReach({
    enabled: Boolean(artifactsQuery.hasNextPage),
    onReachBottom: handleLoadMore,
  });

  return (
    <Box column w={1} p={{ xs: 3, md: 4 }} gap={3}>
      <ArtifactPageHeader
        title="Artifacts"
        subtitle="Discover and share skills, prompts, and instructions in one place."
        uploadButtonLabel="+ Upload artifact"
        onUpload={() => setIsUploadModalOpen(true)}
      />

      <ArtifactSearchFiltersCard
        searchId="artifacts-search"
        searchLabel="Search artifacts"
        searchPlaceholder="Search artifacts..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        typeFilters={ARTIFACT_TYPE_FILTERS.map(
          (typeFilter) => typeFilter.label,
        )}
        activeType={activeArtifactTypeLabel}
        onTypeChange={handleArtifactTypeChange}
        toolFilters={TOOL_FILTERS.map((toolFilter) => toolFilter.label)}
        activeTool={activeToolLabel}
        onToolChange={handleToolChange}
        tags={tags}
        activeTagIds={activeTagIds}
        onTagChange={handleTagChange}
        onClearTags={() => setActiveTagIds([])}
      />

      {artifactsQuery.isPending ? (
        <Box w={1} justifyContent="center" py={6}>
          <Spinner aria-label="Loading artifacts" />
        </Box>
      ) : artifactsQuery.isError ? (
        <Box column w={1} gap={2} alignItems="center" py={6}>
          <P color="error.text">Unable to load artifacts right now.</P>
          <Button
            variant="secondaryDark"
            onClick={() => void artifactsQuery.refetch()}
          >
            Retry
          </Button>
        </Box>
      ) : visibleArtifacts.length === 0 ? (
        <Box column w={1} alignItems="center" gap={2} py={6}>
          <P color="neutral.textSecondary">
            No artifacts match your filters yet.
          </P>
        </Box>
      ) : (
        <>
          <Grid
            w={1}
            gap={3}
            gridTemplateColumns={{ sm: "1fr", md: "1fr 1fr", lg: "1fr 1fr" }}
          >
            {visibleArtifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                onLike={handleLikeArtifact}
                onViewDetails={setSelectedArtifact}
              />
            ))}
          </Grid>

          <div ref={loadMoreRef} />
          {artifactsQuery.isFetchingNextPage ? (
            <Box w={1} justifyContent="center" py={3}>
              <Spinner aria-label="Loading more artifacts" />
            </Box>
          ) : null}
        </>
      )}

      <UploadArtifactModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        artifactTypeOptions={UPLOAD_ARTIFACT_TYPE_OPTIONS}
        availableTools={TOOL_FILTERS.flatMap((toolFilter) =>
          toolFilter.value
            ? [{ id: toolFilter.value, label: toolFilter.label }]
            : [],
        )}
        availableTags={artifactTagOptions}
        onAfterCreate={async ({ mode, artifact }) => {
          await artifactsQuery.refetch();

          if (mode === "markdown") {
            setSelectedArtifact(artifactFromPrompt(artifact, likedPromptIds));
          }
        }}
      />

      <ArtifactDetailsModal
        isOpen={Boolean(selectedArtifact)}
        onClose={() => setSelectedArtifact(null)}
        artifactId={selectedArtifact?.id ?? null}
        artifactType={selectedArtifact?.type ?? PromptType.Skill}
        artifactLabel={
          selectedArtifact
            ? getArtifactLabelByType(selectedArtifact.type)
            : "Artifact"
        }
        onAfterSave={async () => {
          await artifactsQuery.refetch();
        }}
      />
    </Box>
  );
}
