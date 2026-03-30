import { useMemo, useState } from "react";
import { Box, Button, Grid, Heading, Modal, P } from "@veracity/vui";
import type { ArtifactItem } from "../../shared/types/artifacts";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import ArtifactCard from "../../shared/components/ArtifactCard";
import ArtifactSearchFiltersCard from "../../shared/components/ArtifactSearchFiltersCard";

const TOOL_FILTERS = ["All Tools", "GitHub Copilot", "Claude Code"];
const INSTRUCTION_TAGS = [
  "frontend",
  "backend",
  "security",
  "testing",
  "review",
  "deployment",
];

const INSTRUCTIONS: ArtifactItem[] = [
  {
    id: "frontend-vui-instructions",
    title: "Frontend VUI Instructions",
    author: "UI Foundation Team",
    publishedDaysAgo: 12,
    description:
      "Implementation guidance for composing accessible and consistent UIs with VUI primitives.",
    tools: ["GitHub Copilot", "Claude Code"],
    tags: ["frontend", "accessibility", "review"],
    favorites: 286,
    comments: 31,
    updatedDaysAgo: 5,
  },
  {
    id: "secure-api-change-instructions",
    title: "Secure API Change Instructions",
    author: "Security Guild",
    publishedDaysAgo: 7,
    description:
      "Step-by-step instruction template for secure API modifications and validation.",
    tools: ["GitHub Copilot"],
    tags: ["backend", "security", "testing"],
    favorites: 201,
    comments: 17,
    updatedDaysAgo: 2,
  },
  {
    id: "release-readiness-instructions",
    title: "Release Readiness Instructions",
    author: "Release Engineering",
    publishedDaysAgo: 5,
    description:
      "Checklist-first instruction set for release criteria, rollback plans, and monitoring.",
    tools: ["Claude Code"],
    tags: ["deployment", "review", "operations"],
    favorites: 175,
    comments: 13,
    updatedDaysAgo: 1,
  },
];

export default function InstructionsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedInstruction, setSelectedInstruction] =
    useState<ArtifactItem | null>(null);

  const visibleInstructions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return INSTRUCTIONS;
    }

    return INSTRUCTIONS.filter((instruction) => {
      const haystack = [
        instruction.title,
        instruction.author,
        instruction.description,
        ...instruction.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [searchValue]);

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
        toolFilters={TOOL_FILTERS}
        activeTool={TOOL_FILTERS[0]}
        tags={INSTRUCTION_TAGS}
      />

      <Grid
        w={1}
        gap={3}
        gridTemplateColumns={{ sm: "1fr", md: "1fr 1fr", lg: "1fr 1fr" }}
      >
        {visibleInstructions.map((instruction) => (
          <ArtifactCard
            key={instruction.id}
            artifact={instruction}
            onViewDetails={setSelectedInstruction}
          />
        ))}
      </Grid>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        aria-labelledby="upload-instruction-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="upload-instruction-modal-title" as="h2">
            Upload Instruction
          </Heading>
          <P>Upload flow is coming next for reusable instruction artifacts.</P>
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
        isOpen={Boolean(selectedInstruction)}
        onClose={() => setSelectedInstruction(null)}
        aria-labelledby="instruction-detail-modal-title"
      >
        <Box column gap={3} p={4}>
          <Heading id="instruction-detail-modal-title" as="h2">
            {selectedInstruction?.title ?? "Instruction Details"}
          </Heading>
          <P>
            Detailed instruction content will be connected in the next step.
            This placeholder is wired to the selected card.
          </P>
          <Box w={1} justifyContent="flex-end" gap={2}>
            <Button
              variant="secondaryDark"
              onClick={() => setSelectedInstruction(null)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
