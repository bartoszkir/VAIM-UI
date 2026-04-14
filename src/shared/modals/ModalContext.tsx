import { createContext, useContext } from "react";
import type { PromptType, BundleDto } from "../../api/types";
import type { ArtifactItem } from "../types/artifacts";
import type { BundleArtifactItem } from "../types/bundles";

export type ArtifactDetailsParams = {
  artifactId: string;
  artifactType: PromptType;
  artifactLabel?: string;
};

export type BundleDetailsParams = {
  bundleId?: string | null;
  preloadedBundle?: BundleDto;
  initialArtifacts?: BundleArtifactItem[];
};

type ModalContextValue = {
  openUploadArtifact: () => void;
  openArtifactDetails: (params: ArtifactDetailsParams) => void;
  openCollection: (artifacts: ArtifactItem[]) => void;
  openBundleDetails: (params?: BundleDetailsParams) => void;
  collection: Set<string>;
  toggleInCollection: (artifactId: string) => void;
  clearCollection: () => void;
  removeFromCollection: (artifactId: string) => void;
  isInCollection: (artifactId: string) => boolean;
};

export const ModalContext = createContext<ModalContextValue | undefined>(
  undefined,
);

export function useModal() {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }

  return context;
}
