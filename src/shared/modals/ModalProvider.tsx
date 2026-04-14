import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PromptType, ToolType } from "../../api/types";
import type { BundleDto } from "../../api/types";
import { downloadBundleZipByArtifactIds } from "../../api/bundles";
import type { ArtifactItem } from "../types/artifacts";
import type { BundleArtifactItem } from "../types/bundles";
import { useArtifactTags } from "../hooks/useArtifactTags";
import { useCollection } from "../hooks/useCollection";
import ArtifactDetailsModal from "../../pages/artifacts/components/ArtifactDetailsModal";
import CollectionModal from "../../pages/artifacts/components/CollectionModal";
import UploadArtifactModal from "../../pages/artifacts/components/UploadArtifactModal";
import BundleDetailsModal from "../../pages/bundles/components/BundleDetailsModal";
import {
  ModalContext,
  type ArtifactDetailsParams,
  type BundleDetailsParams,
} from "./ModalContext";

const UPLOAD_ARTIFACT_TYPE_OPTIONS = [
  { id: PromptType.Skill, label: "Skill" },
  { id: PromptType.Prompt, label: "Prompt" },
  { id: PromptType.Instruction, label: "Instruction" },
];

const UPLOAD_TOOL_OPTIONS = [
  { id: ToolType.Copilot, label: "GitHub Copilot" },
  { id: ToolType.Claude, label: "Claude Code" },
];

type ModalProviderProps = {
  children: ReactNode;
};

type ArtifactDetailsState = {
  isOpen: boolean;
  artifactId: string | null;
  artifactType: PromptType;
  artifactLabel: string;
};

type CollectionState = {
  isOpen: boolean;
  artifacts: ArtifactItem[];
};

type BundleDetailsState = {
  isOpen: boolean;
  bundleId: string | null;
  preloadedBundle?: BundleDto;
  initialArtifacts?: BundleArtifactItem[];
};

function toArtifactLabel(type: PromptType): string {
  if (type === PromptType.Skill) {
    return "Skill";
  }

  if (type === PromptType.Prompt) {
    return "Prompt";
  }

  return "Instruction";
}

function toBundleArtifactItem(artifact: ArtifactItem): BundleArtifactItem {
  return {
    id: artifact.id,
    title: artifact.title,
    description: artifact.description,
    typeLabel: toArtifactLabel(artifact.type),
    tools: artifact.tools,
    tags: artifact.tags,
  };
}

export default function ModalProvider({ children }: ModalProviderProps) {
  const queryClient = useQueryClient();
  const { tags } = useArtifactTags();
  const {
    collection,
    toggleInCollection,
    clearCollection,
    removeFromCollection,
    isInCollection,
  } = useCollection();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [artifactDetails, setArtifactDetails] = useState<ArtifactDetailsState>({
    isOpen: false,
    artifactId: null,
    artifactType: PromptType.Skill,
    artifactLabel: "Artifact",
  });
  const [collectionModal, setCollectionModal] = useState<CollectionState>({
    isOpen: false,
    artifacts: [],
  });
  const [bundleDetails, setBundleDetails] = useState<BundleDetailsState>({
    isOpen: false,
    bundleId: null,
    preloadedBundle: undefined,
    initialArtifacts: undefined,
  });

  const contextValue = useMemo(
    () => ({
      openUploadArtifact: () => {
        setIsUploadModalOpen(true);
      },
      openArtifactDetails: ({
        artifactId,
        artifactType,
        artifactLabel,
      }: ArtifactDetailsParams) => {
        setArtifactDetails({
          isOpen: true,
          artifactId,
          artifactType,
          artifactLabel: artifactLabel || toArtifactLabel(artifactType),
        });
      },
      openCollection: (artifacts: ArtifactItem[]) => {
        setCollectionModal({ isOpen: true, artifacts });
      },
      openBundleDetails: ({
        bundleId,
        preloadedBundle,
        initialArtifacts,
      }: BundleDetailsParams = {}) => {
        setBundleDetails({
          isOpen: true,
          bundleId: bundleId ?? null,
          preloadedBundle,
          initialArtifacts,
        });
      },
      collection,
      toggleInCollection,
      clearCollection,
      removeFromCollection,
      isInCollection,
    }),
    [
      collection,
      toggleInCollection,
      clearCollection,
      removeFromCollection,
      isInCollection,
    ],
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}

      <UploadArtifactModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        artifactTypeOptions={UPLOAD_ARTIFACT_TYPE_OPTIONS}
        availableTools={UPLOAD_TOOL_OPTIONS}
        availableTags={tags}
        onAfterCreate={async ({ mode, artifact }) => {
          await queryClient.invalidateQueries({ queryKey: ["artifacts"] });

          if (mode === "markdown") {
            setArtifactDetails({
              isOpen: true,
              artifactId: artifact.id,
              artifactType: artifact.type,
              artifactLabel: toArtifactLabel(artifact.type),
            });
          }
        }}
      />

      <ArtifactDetailsModal
        isOpen={artifactDetails.isOpen}
        onClose={() =>
          setArtifactDetails((prev) => ({
            ...prev,
            isOpen: false,
            artifactId: null,
          }))
        }
        artifactId={artifactDetails.artifactId}
        artifactType={artifactDetails.artifactType}
        artifactLabel={artifactDetails.artifactLabel}
        onAfterSave={async () => {
          await queryClient.invalidateQueries({ queryKey: ["artifacts"] });
        }}
      />

      <CollectionModal
        isOpen={collectionModal.isOpen}
        onClose={() =>
          setCollectionModal((prev) => ({ ...prev, isOpen: false }))
        }
        artifacts={collectionModal.artifacts}
        collectionIds={collection}
        onDownload={async (artifactIds) => {
          await downloadBundleZipByArtifactIds({ artifactIds });
        }}
        onCreateBundle={(artifactIds) => {
          const artifactIdSet = new Set(artifactIds);
          const selectedCollectionArtifacts = collectionModal.artifacts.filter(
            (artifact) => artifactIdSet.has(artifact.id),
          );

          setCollectionModal((prev) => ({ ...prev, isOpen: false }));
          setBundleDetails({
            isOpen: true,
            bundleId: null,
            preloadedBundle: undefined,
            initialArtifacts:
              selectedCollectionArtifacts.map(toBundleArtifactItem),
          });
        }}
        onClear={clearCollection}
        onRemoveItem={removeFromCollection}
      />

      <BundleDetailsModal
        isOpen={bundleDetails.isOpen}
        onClose={() =>
          setBundleDetails({
            isOpen: false,
            bundleId: null,
            preloadedBundle: undefined,
            initialArtifacts: undefined,
          })
        }
        bundleId={bundleDetails.bundleId}
        preloadedBundle={bundleDetails.preloadedBundle}
        initialArtifacts={bundleDetails.initialArtifacts}
        onAfterSave={async () => {
          await queryClient.invalidateQueries({ queryKey: ["bundles"] });
        }}
      />
    </ModalContext.Provider>
  );
}
