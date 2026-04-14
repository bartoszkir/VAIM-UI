import { Box, Button, Heading, Modal, P, T, Tag } from "@veracity/vui";
import { PromptType } from "../../../api/types";
import type { ArtifactItem } from "../../../shared/types/artifacts";

type CollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  artifacts: ArtifactItem[];
  collectionIds: Set<string>;
  onDownload: (artifactIds: string[]) => Promise<void>;
  onCreateBundle: (artifactIds: string[]) => void;
  onClear: () => void;
  onRemoveItem: (artifactId: string) => void;
};

function toArtifactTypeLabel(type: PromptType): string {
  if (type === PromptType.Skill) {
    return "Skill";
  }

  if (type === PromptType.Prompt) {
    return "Prompt";
  }

  return "Instruction";
}

export default function CollectionModal({
  isOpen,
  onClose,
  artifacts,
  collectionIds,
  onDownload,
  onCreateBundle,
  onClear,
  onRemoveItem,
}: CollectionModalProps) {
  const selectedArtifacts = artifacts.filter((a) => collectionIds.has(a.id));
  const hasSelectedArtifacts = selectedArtifacts.length > 0;
  const isDownloading = false; // TODO: Add loading state

  const handleDownload = async () => {
    await onDownload(Array.from(collectionIds));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        maxH="calc(100vh - 4rem)"
        w={{ sm: "90%", md: "80%", lg: "720px" }}
        maxW={720}
        column
        gap={3}
        p={4}
        bg="white"
      >
        <Box justifyContent="space-between" alignItems="center" w={1}>
          <Heading as="h2">
            Collection ({selectedArtifacts.length} item
            {selectedArtifacts.length !== 1 ? "s" : ""})
          </Heading>
          <Button
            variant="tertiaryDark"
            size="sm"
            onClick={onClose}
            iconLeft="uiClose"
            aria-label="Close collection modal"
          />
        </Box>

        <Box w={1} maxH="60vh" overflow="auto" column gap={2}>
          {selectedArtifacts.length === 0 ? (
            <P color="neutral.textSecondary">No artifacts in collection</P>
          ) : (
            <Box column gap={1.5}>
              {selectedArtifacts.map((artifact) => (
                <Box
                  key={artifact.id}
                  w={1}
                  column
                  gap={0.75}
                  p={2}
                  bg="neutral.surface"
                >
                  <Box
                    w={1}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1.5}
                  >
                    <T fontWeight="semibold">{artifact.title}</T>
                    <Box gap={1} alignItems="center">
                      <Tag
                        text={toArtifactTypeLabel(artifact.type)}
                        variant="subtleGrey"
                      />
                      <Button
                        variant="tertiaryDark"
                        size="sm"
                        onClick={() => onRemoveItem(artifact.id)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                  <P color="neutral.textSecondary">{artifact.description}</P>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box gap={2} w={1} justifyContent="flex-end">
          <Button variant="secondaryDark" onClick={onClose}>
            Close
          </Button>
          {hasSelectedArtifacts ? (
            <Button
              variant="tertiaryDark"
              onClick={() => {
                onClear();
                onClose();
              }}
            >
              Clear Collection
            </Button>
          ) : null}
          <Button
            variant="tertiaryDark"
            onClick={() => {
              onCreateBundle(Array.from(collectionIds));
              onClose();
            }}
            disabled={!hasSelectedArtifacts}
          >
            Create Bundle
          </Button>
          <Button
            variant="primaryDark"
            onClick={handleDownload}
            disabled={!hasSelectedArtifacts || isDownloading}
            iconLeft={isDownloading ? "uiSpinner" : "uiDownload"}
          >
            Download as Zip
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
