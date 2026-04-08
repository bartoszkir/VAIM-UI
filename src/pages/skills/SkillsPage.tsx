import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Box,
  Grid,
  Heading,
  Input,
  Label,
  Modal,
  P,
  Button,
  Spinner,
  Tag,
  Textarea,
} from "@veracity/vui";
import { getPagedPrompts } from "../../api/prompts";
import { getTags } from "../../api/tags";
import { PromptType, ToolType } from "../../api/types";
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

export default function SkillsPage() {
  const [editingSkill, setEditingSkill] = useState<{
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
  const [selectedSkill, setSelectedSkill] = useState<ArtifactItem | null>(null);

  const tagsQuery = useQuery({
    queryKey: ["artifact-tags"],
    queryFn: getTags,
  });

  const skillsQuery = useInfiniteQuery({
    queryKey: [
      "artifacts",
      PromptType.Skill,
      searchValue,
      activeToolType,
      activeTag,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPagedPrompts({
        page: pageParam,
        pageSize: PAGE_SIZE,
        type: PromptType.Skill,
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

  const visibleSkills = useMemo(
    () =>
      skillsQuery.data?.pages
        .flatMap((page) => page.items ?? [])
        .map(artifactFromPrompt) ?? [],
    [skillsQuery.data],
  );

  const skillTags = useMemo(
    () =>
      (tagsQuery.data ?? [])
        .map((tag) => tag.name?.trim())
        .filter((name): name is string => Boolean(name)),
    [tagsQuery.data],
  );

  const skillTagOptions = useMemo(
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
    if (!skillsQuery.hasNextPage || skillsQuery.isFetchingNextPage) {
      return;
    }

    void skillsQuery.fetchNextPage();
  };

  const loadMoreRef = useBottomReach({
    enabled: Boolean(skillsQuery.hasNextPage),
    onReachBottom: handleLoadMore,
  });

  return (
    <Box column w={1} p={{ xs: 3, md: 4 }} gap={3}>
      <ArtifactPageHeader
        title="Skills"
        subtitle="Discover and share AI engineering artifacts for learning and development."
        uploadButtonLabel="+ Upload skill"
        onUpload={() => setIsUploadModalOpen(true)}
      />

      <ArtifactSearchFiltersCard
        searchId="skills-search"
        searchLabel="Search artifacts"
        searchPlaceholder="Search artifacts..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        toolFilters={TOOL_FILTERS.map((toolFilter) => toolFilter.label)}
        activeTool={activeToolLabel}
        onToolChange={handleToolChange}
        tags={skillTags}
        activeTag={activeTag ?? undefined}
        onTagChange={setActiveTag}
      />

      {skillsQuery.isPending ? (
        <Box w={1} justifyContent="center" py={6}>
          <Spinner aria-label="Loading skills" />
        </Box>
      ) : skillsQuery.isError ? (
        <Box column w={1} gap={2} alignItems="center" py={6}>
          <P color="error.text">Unable to load skills right now.</P>
          <Button
            variant="secondaryDark"
            onClick={() => void skillsQuery.refetch()}
          >
            Retry
          </Button>
        </Box>
      ) : visibleSkills.length === 0 ? (
        <Box column w={1} alignItems="center" gap={2} py={6}>
          <P color="neutral.textSecondary">No skills match your filters yet.</P>
        </Box>
      ) : (
        <>
          <Grid
            w={1}
            gap={3}
            gridTemplateColumns={{ sm: "1fr", md: "1fr 1fr", lg: "1fr 1fr" }}
          >
            {visibleSkills.map((skill) => (
              <ArtifactCard
                key={skill.id}
                artifact={skill}
                onViewDetails={setSelectedSkill}
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
          {skillsQuery.isFetchingNextPage ? (
            <Box w={1} justifyContent="center" py={3}>
              <Spinner aria-label="Loading more skills" />
            </Box>
          ) : null}
        </>
      )}

      <UploadArtifactModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        artifactType={PromptType.Skill}
        artifactLabel="Skill"
        availableTools={TOOL_FILTERS.flatMap((toolFilter) =>
          toolFilter.value
            ? [{ id: toolFilter.value, label: toolFilter.label }]
            : [],
        )}
        availableTags={skillTagOptions}
        onAfterCreate={async ({ mode, artifact }) => {
          await skillsQuery.refetch();

          if (mode === "markdown") {
            setEditingSkill({
              title: artifact.name?.trim() ?? "",
              description: artifact.description?.trim() ?? "",
              content: artifact.content?.trim() ?? "",
            });
          }
        }}
      />

      <Modal
        isOpen={Boolean(editingSkill)}
        onClose={() => setEditingSkill(null)}
        aria-labelledby="skill-edit-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="skill-edit-modal-title" as="h2">
            Edit Skill
          </Heading>

          <Box column gap={1}>
            <Label htmlFor="skill-edit-title" text="Title" />
            <Input
              id="skill-edit-title"
              value={editingSkill?.title ?? ""}
              onChange={(event) =>
                setEditingSkill((prev) =>
                  prev ? { ...prev, title: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box column gap={1}>
            <Label htmlFor="skill-edit-description" text="Description" />
            <Textarea
              id="skill-edit-description"
              rows={3}
              value={editingSkill?.description ?? ""}
              onChange={(event) =>
                setEditingSkill((prev) =>
                  prev ? { ...prev, description: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box column gap={1}>
            <Label htmlFor="skill-edit-content" text="Content" />
            <Textarea
              id="skill-edit-content"
              rows={6}
              value={editingSkill?.content ?? ""}
              onChange={(event) =>
                setEditingSkill((prev) =>
                  prev ? { ...prev, content: event.target.value } : prev,
                )
              }
            />
          </Box>

          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setEditingSkill(null)}
            >
              Cancel
            </Button>
            <Button variant="primaryDark" onClick={() => setEditingSkill(null)}>
              Save
            </Button>
          </Box>
        </Box>
      </Modal>

      <ArtifactDetailsModal
        isOpen={Boolean(selectedSkill)}
        onClose={() => setSelectedSkill(null)}
        artifactId={selectedSkill?.id ?? null}
        artifactType={PromptType.Skill}
        artifactLabel="Skill"
        onAfterSave={async () => {
          await skillsQuery.refetch();
        }}
      />
    </Box>
  );
}
