import { useMemo, useState } from "react";
import { Box, Button, Grid, Heading, Modal, P } from "@veracity/vui";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";
import ArtifactCard from "../../shared/components/ArtifactCard";

const TOOL_FILTERS = ["All Tools", "GitHub Copilot", "Claude Code"];
const PROMPT_TAGS = [
  "architecture",
  "debugging",
  "refactoring",
  "testing",
  "docs",
  "security",
];

const PROMPTS: ArtifactItem[] = [
  {
    id: "architecture-review-prompt",
    title: "Architecture Review Prompt",
    author: "Engineering Ops",
    publishedAt: "2026-03-23T00:00:00.000Z",
    description:
      "A structured prompt for identifying coupling issues and modularization opportunities.",
    tools: ["GitHub Copilot", "Claude Code"],
    tags: ["architecture", "refactoring", "analysis"],
    favorites: 219,
    isFavorite: true,
    comments: 25,
    updatedAt: "2026-03-29T00:00:00.000Z",
  },
  {
    id: "incident-postmortem-prompt",
    title: "Incident Postmortem Prompt",
    author: "SRE Team",
    publishedAt: "2026-03-20T00:00:00.000Z",
    description:
      "Generates consistent postmortem drafts with timelines, impact summaries, and actions.",
    tools: ["Claude Code"],
    tags: ["docs", "debugging", "workflow"],
    favorites: 164,
    isFavorite: false,
    comments: 16,
    updatedAt: "2026-03-27T00:00:00.000Z",
  },
  {
    id: "api-contract-test-prompt",
    title: "API Contract Test Prompt",
    author: "Platform QA",
    publishedAt: "2026-03-28T00:00:00.000Z",
    description:
      "Creates API contract test scenarios from endpoint docs and schema definitions.",
    tools: ["GitHub Copilot"],
    tags: ["testing", "security", "api"],
    favorites: 183,
    isFavorite: false,
    comments: 12,
    updatedAt: "2026-03-30T00:00:00.000Z",
  },
];

export default function PromptsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<ArtifactItem | null>(
    null,
  );

  const visiblePrompts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return PROMPTS;
    }

    return PROMPTS.filter((prompt) => {
      const haystack = [
        prompt.title,
        prompt.author,
        prompt.description,
        ...prompt.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [searchValue]);

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
        activeTool={TOOL_FILTERS[0]}
        tags={PROMPT_TAGS}
      />

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

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        aria-labelledby="upload-prompt-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="upload-prompt-modal-title" as="h2">
            Upload Prompt
          </Heading>
          <P>Upload flow is coming next for reusable prompt artifacts.</P>
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
