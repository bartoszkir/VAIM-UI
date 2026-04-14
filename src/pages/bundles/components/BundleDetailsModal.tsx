import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Heading,
  Input,
  Label,
  Message,
  Modal,
  P,
  Spinner,
  T,
  Tag,
  Textarea,
  useToast,
} from "@veracity/vui";
import {
  createBundle,
  downloadBundleZip,
  downloadBundleZipByArtifactIds,
  getBundleById,
  updateBundle,
} from "../../../api/bundles";
import { getPagedPrompts } from "../../../api/prompts";
import type {
  BundleArtifactDto,
  BundleDto,
  PromptDto,
} from "../../../api/types";
import { PromptType, ToolType } from "../../../api/types";
import type { BundleArtifactItem } from "../../../shared/types/bundles";
import { bundleFromDto } from "../../../shared/utils/bundleFromDto";
import { relativeTime } from "../../../shared/utils/relativeTime";

const TOOL_TYPE_LABELS: Record<number, string> = {
  [ToolType.Copilot]: "GitHub Copilot",
  [ToolType.Claude]: "Claude Code",
};

const PROMPT_TYPE_LABELS: Record<number, string> = {
  [PromptType.Prompt]: "Prompt",
  [PromptType.Instruction]: "Instruction",
  [PromptType.Skill]: "Skill",
};

const ARTIFACT_SEARCH_PAGE_SIZE = 8;

type BundleDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bundleId: string | null;
  preloadedBundle?: BundleDto;
  onAfterSave?: (savedBundle: BundleDto) => void | Promise<void>;
};

function toReadableTimestamp(value?: string | null): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return `${date.toLocaleString()} (${relativeTime(value)})`;
}

function toArtifactItem(artifact: BundleArtifactDto): BundleArtifactItem {
  return {
    id: artifact.id,
    title: artifact.name?.trim() || "Untitled artifact",
    description: artifact.description?.trim() || "No description provided.",
    typeLabel: PROMPT_TYPE_LABELS[artifact.type] || "Artifact",
    tools: (artifact.toolTypes ?? [])
      .map((toolType) => TOOL_TYPE_LABELS[toolType])
      .filter((toolLabel): toolLabel is string => Boolean(toolLabel)),
    tags: (artifact.tags ?? [])
      .map((tag) => tag.name?.trim())
      .filter((tagName): tagName is string => Boolean(tagName)),
  };
}

function toBundleArtifactDto(prompt: PromptDto): BundleArtifactDto {
  return {
    id: prompt.id,
    name: prompt.name,
    description: prompt.description,
    type: prompt.type,
    toolTypes: prompt.toolTypes,
    tags: prompt.tags,
  };
}

export default function BundleDetailsModal({
  isOpen,
  onClose,
  bundleId,
  preloadedBundle,
  onAfterSave,
}: BundleDetailsModalProps) {
  const { showSuccess, showError: showErrorToast } = useToast();
  const previousIsOpenRef = useRef(isOpen);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isStaticCreationMode, setIsStaticCreationMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artifactSearch, setArtifactSearch] = useState("");
  const [editableArtifacts, setEditableArtifacts] = useState<
    BundleArtifactItem[]
  >([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedBundleOverride, setSavedBundleOverride] =
    useState<BundleDto | null>(null);
  const shouldFetchBundle =
    isOpen && Boolean(bundleId) && !preloadedBundle && !savedBundleOverride;

  const bundleQuery = useQuery({
    queryKey: ["bundle-details", bundleId],
    queryFn: () => getBundleById(bundleId as string),
    enabled: shouldFetchBundle,
  });

  const bundleQueryData =
    savedBundleOverride ?? preloadedBundle ?? bundleQuery.data;

  const bundle = useMemo(
    () => (bundleQueryData ? bundleFromDto(bundleQueryData) : null),
    [bundleQueryData],
  );

  const artifactSearchQuery = useQuery({
    queryKey: [
      "bundle-artifact-search",
      artifactSearch,
      editableArtifacts.map((artifact) => artifact.id).join("|"),
    ],
    queryFn: async () => {
      const excludedIds = new Set(
        editableArtifacts.map((artifact) => artifact.id),
      );
      const response = await getPagedPrompts({
        page: 1,
        pageSize: ARTIFACT_SEARCH_PAGE_SIZE,
        search: artifactSearch,
      });

      return (response.items ?? [])
        .filter((prompt) => !excludedIds.has(prompt.id))
        .map(toBundleArtifactDto);
    },
    enabled: isEditMode && artifactSearch.trim().length > 1,
  });

  useEffect(() => {
    if (!bundle || isEditMode) {
      return;
    }

    setTitle(bundle.title);
    setDescription(bundle.description);
    setEditableArtifacts(bundle.artifacts);
    setFieldErrors({});
  }, [bundle, isEditMode]);

  useEffect(() => {
    if (previousIsOpenRef.current && !isOpen) {
      setIsEditMode(false);
      setIsStaticCreationMode(false);
      setIsSaving(false);
      setFieldErrors({});
      setArtifactSearch("");
      setSavedBundleOverride(null);
    }

    previousIsOpenRef.current = isOpen;
  }, [isOpen]);

  const resetFromBundle = () => {
    if (!bundle) {
      setIsEditMode(false);
      return;
    }

    setTitle(bundle.title);
    setDescription(bundle.description);
    setEditableArtifacts(bundle.artifacts);
    setArtifactSearch("");
    setFieldErrors({});
    setIsEditMode(false);
    setIsStaticCreationMode(false);
  };

  const handleDownload = async () => {
    if (!bundle) {
      return;
    }

    try {
      if (bundle.isDynamic) {
        await downloadBundleZipByArtifactIds({
          artifactIds: bundle.artifacts.map((artifact) => artifact.id),
        });
      } else {
        await downloadBundleZip(bundle.id);
      }
      showSuccess("Bundle download started");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to download bundle right now.";
      showErrorToast(message);
    }
  };

  const handleAddArtifact = (artifact: BundleArtifactDto) => {
    const item = toArtifactItem(artifact);
    setEditableArtifacts((prev) => [...prev, item]);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.artifacts;
      return next;
    });
  };

  const handleRemoveArtifact = (artifactId: string) => {
    setEditableArtifacts((prev) =>
      prev.filter((artifact) => artifact.id !== artifactId),
    );
  };

  const handleSave = async () => {
    if (!bundle) {
      return;
    }

    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Title is required.";
    }

    if (editableArtifacts.length === 0) {
      errors.artifacts = "Add at least one artifact to the bundle.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);

    try {
      let savedBundle: BundleDto;

      if (bundle.isDynamic || isStaticCreationMode) {
        savedBundle = await createBundle({
          name: title.trim(),
          description: description.trim(),
          artifactIds: editableArtifacts.map((artifact) => artifact.id),
        });
        showSuccess("Static bundle created");
      } else {
        savedBundle = await updateBundle(bundle.id, {
          name: title.trim(),
          description: description.trim(),
          artifactIds: editableArtifacts.map((artifact) => artifact.id),
        });
        showSuccess("Bundle updated successfully");
      }

      setSavedBundleOverride(savedBundle);

      if (shouldFetchBundle) {
        await bundleQuery.refetch();
      }
      if (onAfterSave) {
        await onAfterSave(savedBundle);
      }

      setIsEditMode(false);
      setIsStaticCreationMode(false);
      setArtifactSearch("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save bundle right now.";
      setFieldErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setIsSaving(false);
    }
  };

  const artifactSuggestions = useMemo(
    () => artifactSearchQuery.data ?? [],
    [artifactSearchQuery.data],
  );

  const modalTitle = bundle?.title || "Bundle details";
  const metadataPublishedAt = toReadableTimestamp(bundleQueryData?.createdAt);
  const metadataUpdatedAt = toReadableTimestamp(
    bundleQueryData?.updatedAt ?? bundleQueryData?.createdAt,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="bundle-details-title"
    >
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        maxH="calc(100vh - 4rem)"
        w={{ sm: "90%", md: "80%", lg: "760px" }}
        column
        gap={3}
        bg="white"
      >
        <Box column gap={0.75} px={2} pt={2}>
          <Heading id="bundle-details-title" as="h2">
            {modalTitle}
          </Heading>
          {bundle ? (
            <Box w={1} column gap={0.25} aria-label="Bundle metadata">
              <Box gap={0.5} alignItems="baseline">
                <T color="neutral.textSecondary" fontWeight="semibold">
                  Author
                </T>
                <T color="neutral.textSecondary">{bundle.author}</T>
              </Box>
              <Box gap={1.5} alignItems="baseline" flexWrap="wrap">
                <T
                  color="neutral.textSecondary"
                  fontWeight="semibold"
                  fontSize="0.875rem"
                >
                  Created
                </T>
                <T color="neutral.textSecondary" fontSize="0.875rem">
                  {metadataPublishedAt}
                </T>
                <T
                  color="neutral.textSecondary"
                  fontWeight="semibold"
                  fontSize="0.875rem"
                >
                  Updated
                </T>
                <T color="neutral.textSecondary" fontSize="0.875rem">
                  {metadataUpdatedAt}
                </T>
              </Box>
            </Box>
          ) : null}
        </Box>

        {shouldFetchBundle && bundleQuery.isPending ? (
          <Box w={1} justifyContent="center" py={6}>
            <Spinner aria-label="Loading bundle details" />
          </Box>
        ) : shouldFetchBundle && bundleQuery.isError ? (
          <Box column gap={2} px={2} pb={2}>
            <Message variant="error">Unable to load bundle details.</Message>
            <Box w={1} justifyContent="flex-end" gap={2}>
              <Button
                variant="secondaryDark"
                onClick={() => void bundleQuery.refetch()}
              >
                Retry
              </Button>
              <Button variant="secondaryDark" onClick={onClose}>
                Close
              </Button>
            </Box>
          </Box>
        ) : bundle ? (
          <>
            <Box column overflow="auto" gap={3} py={2} px={2}>
              {fieldErrors.form ? (
                <Message variant="error">{fieldErrors.form}</Message>
              ) : null}

              {!isEditMode ? (
                <>
                  <Box column gap={1}>
                    <T fontWeight="semibold">Description</T>
                    <P color="neutral.textSecondary">{bundle.description}</P>
                  </Box>

                  <Box column gap={1.5}>
                    <T fontWeight="semibold">Artifacts</T>
                    <Box column gap={1.5}>
                      {bundle.artifacts.map((artifact) => (
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
                            <Tag
                              text={artifact.typeLabel}
                              variant="subtleGrey"
                            />
                          </Box>
                          <P color="neutral.textSecondary">
                            {artifact.description}
                          </P>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </>
              ) : (
                <>
                  <Box column gap={1}>
                    <Label
                      htmlFor="bundle-details-title-input"
                      text="Bundle name *"
                    />
                    <Input
                      id="bundle-details-title-input"
                      value={title}
                      onChange={(event) => {
                        setTitle(event.target.value);
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.title;
                          return next;
                        });
                      }}
                      isInvalid={Boolean(fieldErrors.title)}
                    />
                    {fieldErrors.title ? (
                      <Message variant="error">{fieldErrors.title}</Message>
                    ) : null}
                  </Box>

                  <Box column gap={1}>
                    <Label
                      htmlFor="bundle-details-description-input"
                      text="Description"
                    />
                    <Textarea
                      id="bundle-details-description-input"
                      rows={3}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </Box>

                  <Box column gap={1}>
                    <Label
                      htmlFor="bundle-artifact-search"
                      text="Search artifacts to add"
                    />
                    <Input
                      id="bundle-artifact-search"
                      value={artifactSearch}
                      onChange={(event) =>
                        setArtifactSearch(event.target.value)
                      }
                      placeholder="Search by artifact title or description"
                    />
                  </Box>

                  {artifactSearchQuery.isFetching ? (
                    <Box w={1} justifyContent="center" py={2}>
                      <Spinner aria-label="Searching artifacts" />
                    </Box>
                  ) : artifactSearch.trim().length > 1 ? (
                    <Box column gap={1}>
                      {artifactSuggestions.length > 0 ? (
                        artifactSuggestions.map((artifact) => {
                          const artifactItem = toArtifactItem(artifact);

                          return (
                            <Box
                              key={`suggestion-${artifactItem.id}`}
                              w={1}
                              justifyContent="space-between"
                              alignItems="flex-start"
                              gap={2}
                              p={2}
                              bg="neutral.surface"
                            >
                              <Box column gap={0.5}>
                                <T fontWeight="semibold">
                                  {artifactItem.title}
                                </T>
                                <P color="neutral.textSecondary">
                                  {artifactItem.description}
                                </P>
                              </Box>
                              <Button
                                variant="tertiaryDark"
                                size="sm"
                                onClick={() => handleAddArtifact(artifact)}
                              >
                                Add
                              </Button>
                            </Box>
                          );
                        })
                      ) : (
                        <P color="neutral.textSecondary">
                          No artifacts match this search.
                        </P>
                      )}
                    </Box>
                  ) : null}

                  <Box column gap={1.5}>
                    <Box
                      w={1}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <T fontWeight="semibold">
                        Artifacts in bundle ({editableArtifacts.length})
                      </T>
                    </Box>

                    {fieldErrors.artifacts ? (
                      <Message variant="error">{fieldErrors.artifacts}</Message>
                    ) : null}

                    <Box column gap={1.5}>
                      {editableArtifacts.map((artifact) => (
                        <Box
                          key={`editable-${artifact.id}`}
                          w={1}
                          justifyContent="space-between"
                          alignItems="flex-start"
                          gap={2}
                          p={2}
                          bg="neutral.surface"
                        >
                          <Box column gap={0.75}>
                            <T fontWeight="semibold">{artifact.title}</T>
                            <P color="neutral.textSecondary">
                              {artifact.description}
                            </P>
                            <Box w={1} flexWrap="wrap" gap={1}>
                              <Tag
                                text={artifact.typeLabel}
                                variant="subtleGrey"
                              />
                              {artifact.tags.slice(0, 2).map((tag) => (
                                <Tag
                                  key={`${artifact.id}-${tag}`}
                                  text={tag}
                                  variant="subtleGrey"
                                />
                              ))}
                            </Box>
                          </Box>
                          <Button
                            variant="tertiaryDark"
                            size="sm"
                            onClick={() => handleRemoveArtifact(artifact.id)}
                          >
                            Remove
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </>
              )}
            </Box>

            <Box w={1} justifyContent="flex-end" gap={2} px={2} pb={2}>
              {!isEditMode ? (
                <>
                  <Button variant="secondaryDark" onClick={handleDownload}>
                    Download bundle
                  </Button>
                  {bundle.isDynamic ? (
                    <Button
                      variant="primaryDark"
                      onClick={() => {
                        setIsStaticCreationMode(true);
                        setIsEditMode(true);
                      }}
                    >
                      Create static bundle
                    </Button>
                  ) : (
                    <Button
                      variant="primaryDark"
                      onClick={() => {
                        setIsStaticCreationMode(false);
                        setIsEditMode(true);
                      }}
                    >
                      Edit bundle
                    </Button>
                  )}
                  <Button variant="secondaryDark" onClick={onClose}>
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondaryDark"
                    onClick={resetFromBundle}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primaryDark"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Saving..."
                      : bundle.isDynamic || isStaticCreationMode
                        ? "Create static bundle"
                        : "Save changes"}
                  </Button>
                </>
              )}
            </Box>
          </>
        ) : null}
      </Box>
    </Modal>
  );
}
