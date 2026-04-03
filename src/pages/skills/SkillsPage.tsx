import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Box,
  Grid,
  Heading,
  Modal,
  P,
  Button,
  Spinner,
  Tag,
} from "@veracity/vui";
import { getPagedPrompts } from "../../api/prompts";
import { getTags } from "../../api/tags";
import { PromptType } from "../../api/types";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactCard from "../../shared/components/ArtifactCard";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";
import UploadArtifactModal from "../../shared/components/UploadArtifactModal";
import { useBottomReach } from "../../shared/hooks/useBottomReach";
import { artifactFromPrompt } from "../../shared/utils/artifactFromPrompt";

const TOOL_FILTERS = ["All Tools", "GitHub Copilot", "Claude Code"];
const PAGE_SIZE = 12;

export default function SkillsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [activeTool, setActiveTool] = useState(TOOL_FILTERS[0]);
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
      activeTool,
      activeTag,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPagedPrompts({
        page: pageParam,
        pageSize: PAGE_SIZE,
        type: PromptType.Skill,
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
        toolFilters={TOOL_FILTERS}
        activeTool={activeTool}
        onToolChange={setActiveTool}
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
        artifactLabel="Skill"
        availableTools={TOOL_FILTERS.filter((tool) => tool !== "All Tools")}
        availableTags={skillTags}
      />

      <Modal
        isOpen={Boolean(selectedSkill)}
        onClose={() => setSelectedSkill(null)}
        aria-labelledby="skill-detail-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="skill-detail-modal-title" as="h2">
            {selectedSkill?.title ?? "Skill Details"}
          </Heading>
          <P>
            Detailed skill content will be connected in the next step. This
            placeholder is wired to the selected card.
          </P>
          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setSelectedSkill(null)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
