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
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";
import ArtifactCard from "../../shared/components/ArtifactCard";
import UploadArtifactModal from "../../shared/components/UploadArtifactModal";
import { useBottomReach } from "../../shared/hooks/useBottomReach";
import { artifactFromPrompt } from "../../shared/utils/artifactFromPrompt";

const TOOL_FILTERS = ["All Tools", "GitHub Copilot", "Claude Code"];
const PAGE_SIZE = 12;

export default function PromptsPage() {
  const [editingPrompt, setEditingPrompt] = useState<{
    title: string;
    description: string;
    content: string;
  } | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [activeTool, setActiveTool] = useState(TOOL_FILTERS[0]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<ArtifactItem | null>(
    null,
  );

  const tagsQuery = useQuery({
    queryKey: ["artifact-tags"],
    queryFn: getTags,
  });

  const promptsQuery = useInfiniteQuery({
    queryKey: [
      "artifacts",
      PromptType.Prompt,
      searchValue,
      activeTool,
      activeTag,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPagedPrompts({
        page: pageParam,
        pageSize: PAGE_SIZE,
        type: PromptType.Prompt,
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

  const visiblePrompts = useMemo(
    () =>
      promptsQuery.data?.pages
        .flatMap((page) => page.items ?? [])
        .map(artifactFromPrompt) ?? [],
    [promptsQuery.data],
  );

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
        toolFilters={TOOL_FILTERS}
        activeTool={activeTool}
        onToolChange={setActiveTool}
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
        availableTools={TOOL_FILTERS.filter((tool) => tool !== "All Tools")}
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

      <Modal
        isOpen={Boolean(selectedPrompt)}
        onClose={() => setSelectedPrompt(null)}
        aria-labelledby="prompt-detail-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="prompt-detail-modal-title" as="h2">
            {selectedPrompt?.title ?? "Prompt Details"}
          </Heading>
          <P>
            Detailed prompt content will be connected in the next step. This
            placeholder is wired to the selected card.
          </P>
          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setSelectedPrompt(null)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
