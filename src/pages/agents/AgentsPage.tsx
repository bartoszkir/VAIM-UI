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
import ArtifactCard from "../../shared/components/ArtifactCard";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";
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

export default function AgentsPage() {
  const userInfo = useUserInfo();
  const queryClient = useQueryClient();
  const [editingAgent, setEditingAgent] = useState<{
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
  const [selectedAgent, setSelectedAgent] = useState<ArtifactItem | null>(null);

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
          queryKey: ["artifacts", PromptType.Agent],
        }),
      ]);
    },
  });

  const agentsQuery = useInfiniteQuery({
    queryKey: [
      "artifacts",
      PromptType.Agent,
      searchValue,
      activeToolType,
      activeTag,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPagedPrompts({
        page: pageParam,
        pageSize: PAGE_SIZE,
        type: PromptType.Agent,
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

  const visibleAgents = useMemo(
    () =>
      agentsQuery.data?.pages
        .flatMap((page) => page.items ?? [])
        .map((agent) => artifactFromPrompt(agent, likedPromptIds)) ?? [],
    [agentsQuery.data, likedPromptIds],
  );

  const handleLikeAgent = (agent: ArtifactItem) => {
    if (!userInfo || agent.isFavorite || likePromptMutation.isPending) {
      return;
    }

    likePromptMutation.mutate(agent.id);
  };

  const agentTags = useMemo(
    () =>
      (tagsQuery.data ?? [])
        .map((tag) => tag.name?.trim())
        .filter((name): name is string => Boolean(name)),
    [tagsQuery.data],
  );

  const agentTagOptions = useMemo(
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
    if (!agentsQuery.hasNextPage || agentsQuery.isFetchingNextPage) {
      return;
    }

    void agentsQuery.fetchNextPage();
  };

  const loadMoreRef = useBottomReach({
    enabled: Boolean(agentsQuery.hasNextPage),
    onReachBottom: handleLoadMore,
  });

  return (
    <Box column w={1} p={{ xs: 3, md: 4 }} gap={3}>
      <ArtifactPageHeader
        title="Agents"
        subtitle="Find reusable agent profiles for exploration, quality, and delivery workflows."
        uploadButtonLabel="+ Upload agent"
        onUpload={() => setIsUploadModalOpen(true)}
      />

      <ArtifactSearchFiltersCard
        searchId="agents-search"
        searchLabel="Search agents"
        searchPlaceholder="Search agents..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        toolFilters={TOOL_FILTERS.map((toolFilter) => toolFilter.label)}
        activeTool={activeToolLabel}
        onToolChange={handleToolChange}
        tags={agentTags}
        activeTag={activeTag ?? undefined}
        onTagChange={setActiveTag}
      />

      {agentsQuery.isPending ? (
        <Box w={1} justifyContent="center" py={6}>
          <Spinner aria-label="Loading agents" />
        </Box>
      ) : agentsQuery.isError ? (
        <Box column w={1} gap={2} alignItems="center" py={6}>
          <P color="error.text">Unable to load agents right now.</P>
          <Button
            variant="secondaryDark"
            onClick={() => void agentsQuery.refetch()}
          >
            Retry
          </Button>
        </Box>
      ) : visibleAgents.length === 0 ? (
        <Box column w={1} alignItems="center" gap={2} py={6}>
          <P color="neutral.textSecondary">No agents match your filters yet.</P>
        </Box>
      ) : (
        <>
          <Grid
            w={1}
            gap={3}
            gridTemplateColumns={{ sm: "1fr", md: "1fr 1fr", lg: "1fr 1fr" }}
          >
            {visibleAgents.map((agent) => (
              <ArtifactCard
                key={agent.id}
                artifact={agent}
                onLike={handleLikeAgent}
                onViewDetails={setSelectedAgent}
                viewDetailsLabel="View profile"
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
          {agentsQuery.isFetchingNextPage ? (
            <Box w={1} justifyContent="center" py={3}>
              <Spinner aria-label="Loading more agents" />
            </Box>
          ) : null}
        </>
      )}

      <UploadArtifactModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        artifactType={PromptType.Agent}
        artifactLabel="Agent"
        availableTools={TOOL_FILTERS.flatMap((toolFilter) =>
          toolFilter.value
            ? [{ id: toolFilter.value, label: toolFilter.label }]
            : [],
        )}
        availableTags={agentTagOptions}
        onAfterCreate={async ({ mode, artifact }) => {
          await agentsQuery.refetch();

          if (mode === "markdown") {
            setEditingAgent({
              title: artifact.name?.trim() ?? "",
              description: artifact.description?.trim() ?? "",
              content: artifact.content?.trim() ?? "",
            });
          }
        }}
      />

      <Modal
        isOpen={Boolean(editingAgent)}
        onClose={() => setEditingAgent(null)}
        aria-labelledby="agent-edit-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="agent-edit-modal-title" as="h2">
            Edit Agent
          </Heading>

          <Box column gap={1}>
            <Label htmlFor="agent-edit-title" text="Title" />
            <Input
              id="agent-edit-title"
              value={editingAgent?.title ?? ""}
              onChange={(event) =>
                setEditingAgent((prev) =>
                  prev ? { ...prev, title: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box column gap={1}>
            <Label htmlFor="agent-edit-description" text="Description" />
            <Textarea
              id="agent-edit-description"
              rows={3}
              value={editingAgent?.description ?? ""}
              onChange={(event) =>
                setEditingAgent((prev) =>
                  prev ? { ...prev, description: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box column gap={1}>
            <Label htmlFor="agent-edit-content" text="Content" />
            <Textarea
              id="agent-edit-content"
              rows={6}
              value={editingAgent?.content ?? ""}
              onChange={(event) =>
                setEditingAgent((prev) =>
                  prev ? { ...prev, content: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setEditingAgent(null)}
            >
              Cancel
            </Button>
            <Button variant="primaryDark" onClick={() => setEditingAgent(null)}>
              Save
            </Button>
          </Box>
        </Box>
      </Modal>

      <ArtifactDetailsModal
        isOpen={Boolean(selectedAgent)}
        onClose={() => setSelectedAgent(null)}
        artifactId={selectedAgent?.id ?? null}
        artifactType={PromptType.Agent}
        artifactLabel="Agent"
        onAfterSave={async () => {
          await agentsQuery.refetch();
        }}
      />
    </Box>
  );
}
