import { useMemo, useState } from "react";
import { Box, Button, Grid, Heading, Modal, P } from "@veracity/vui";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactCard from "../../shared/components/ArtifactCard";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";

const TOOL_FILTERS = ["All Tools", "GitHub Copilot", "Claude Code"];
const AGENT_TAGS = [
  "automation",
  "analysis",
  "productivity",
  "workflow",
  "documentation",
  "testing",
];

const AGENTS: ArtifactItem[] = [
  {
    id: "codebase-explorer-agent",
    title: "Codebase Explorer Agent",
    author: "Platform Team",
    publishedDaysAgo: 4,
    description:
      "A guided agent profile for fast repository discovery and architecture mapping.",
    tools: ["GitHub Copilot", "Claude Code"],
    tags: ["analysis", "workflow", "documentation"],
    favorites: 192,
    comments: 14,
    updatedDaysAgo: 1,
  },
  {
    id: "release-notes-agent",
    title: "Release Notes Agent",
    author: "DevOps Guild",
    publishedDaysAgo: 9,
    description:
      "Automates release-note generation from commits, pull requests, and issue links.",
    tools: ["GitHub Copilot"],
    tags: ["automation", "documentation", "devops"],
    favorites: 141,
    comments: 11,
    updatedDaysAgo: 2,
  },
  {
    id: "qa-regression-agent",
    title: "QA Regression Agent",
    author: "Quality Team",
    publishedDaysAgo: 6,
    description:
      "Builds targeted regression checklists based on changed files and test history.",
    tools: ["Claude Code"],
    tags: ["testing", "analysis", "productivity"],
    favorites: 167,
    comments: 19,
    updatedDaysAgo: 3,
  },
];

export default function AgentsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ArtifactItem | null>(null);

  const visibleAgents = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return AGENTS;
    }

    return AGENTS.filter((agent) => {
      const haystack = [
        agent.title,
        agent.author,
        agent.description,
        ...agent.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [searchValue]);

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
        toolFilters={TOOL_FILTERS}
        activeTool={TOOL_FILTERS[0]}
        tags={AGENT_TAGS}
      />

      <Grid
        w={1}
        gap={3}
        gridTemplateColumns={{ sm: "1fr", md: "1fr 1fr", lg: "1fr 1fr" }}
      >
        {visibleAgents.map((agent) => (
          <ArtifactCard
            key={agent.id}
            artifact={agent}
            onViewDetails={setSelectedAgent}
            viewDetailsLabel="View profile"
          />
        ))}
      </Grid>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        aria-labelledby="upload-agent-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="upload-agent-modal-title" as="h2">
            Upload Agent
          </Heading>
          <P>Upload flow is coming next for reusable agent profiles.</P>
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
        isOpen={Boolean(selectedAgent)}
        onClose={() => setSelectedAgent(null)}
        aria-labelledby="agent-detail-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="agent-detail-modal-title" as="h2">
            {selectedAgent?.title ?? "Agent Details"}
          </Heading>
          <P>
            Detailed agent profile content will be connected in the next step.
            This placeholder is wired to the selected card.
          </P>
          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setSelectedAgent(null)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
