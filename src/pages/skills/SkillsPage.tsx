import { useMemo, useState } from "react";
import { Box, Grid, Heading, Modal, P, Button } from "@veracity/vui";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactCard from "../../shared/components/ArtifactCard";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";

const TOOL_FILTERS = ["All Tools", "GitHub Copilot", "Claude Code"];

const SKILL_TAGS = [
  "react",
  "nextjs",
  "auth",
  "backend",
  "ui",
  "database",
  "api",
  "security",
  "performance",
  "devops",
  "testing",
  "accessibility",
  "typescript",
];

const SKILLS: ArtifactItem[] = [
  {
    id: "react-component-refactoring",
    title: "React Component Refactoring",
    author: "Alex Chen",
    publishedAt: "2026-03-24T00:00:00.000Z",
    description:
      "Advanced patterns for refactoring large React components using composition and hooks.",
    tools: ["GitHub Copilot", "Claude Code"],
    tags: ["react", "performance", "refactoring"],
    favorites: 245,
    isFavorite: true,
    comments: 18,
    updatedAt: "2026-03-29T00:00:00.000Z",
  },
  {
    id: "ui-component-library-generation",
    title: "UI Component Library Generation",
    author: "Design Team",
    publishedAt: "2026-03-21T00:00:00.000Z",
    description:
      "Prompts and patterns for generating consistent, accessible component libraries.",
    tools: ["GitHub Copilot", "Claude Code"],
    tags: ["ui", "components", "accessibility", "design-systems"],
    favorites: 334,
    isFavorite: true,
    comments: 27,
    updatedAt: "2026-03-28T00:00:00.000Z",
  },
  {
    id: "typescript-type-inference",
    title: "TypeScript Type Inference",
    author: "TypeScript Team",
    publishedAt: "2026-03-26T00:00:00.000Z",
    description:
      "Techniques for leveraging advanced TypeScript type inference in your codebase.",
    tools: ["GitHub Copilot"],
    tags: ["typescript", "backend", "performance"],
    favorites: 178,
    isFavorite: false,
    comments: 9,
    updatedAt: "2026-03-30T00:00:00.000Z",
  },
];

export default function SkillsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<ArtifactItem | null>(null);

  const visibleSkills = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return SKILLS;
    }

    return SKILLS.filter((skill) => {
      const haystack = [
        skill.title,
        skill.author,
        skill.description,
        ...skill.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [searchValue]);

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
        activeTool={TOOL_FILTERS[0]}
        tags={SKILL_TAGS}
      />

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

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        aria-labelledby="upload-skill-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="upload-skill-modal-title" as="h2">
            Upload Skill
          </Heading>
          <P>
            Upload flow is coming next. This placeholder modal confirms button
            wiring and interaction behavior.
          </P>
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
