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
  Prose,
  Spinner,
  T,
  Tag,
  Textarea,
} from "@veracity/vui";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useToast } from "@veracity/vui";
import { getPromptById, getToolTypes, updatePrompt } from "../../api/prompts";
import { getTags } from "../../api/tags";
import { HttpError } from "../../api/httpClient";
import { PromptType, ToolType } from "../../api/types";
import type { TagDto, ToolTypeDto } from "../../api/types";
import { useUserInfo } from "../../auth/authContext";
import { relativeTime } from "../utils/relativeTime";

type ArtifactDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  artifactId: string | null;
  artifactType: PromptType;
  artifactLabel: string;
  onAfterSave?: () => void | Promise<void>;
};

type ArtifactTag = {
  id: string;
  name: string;
};

type ArtifactTool = {
  id: ToolType;
  label: string;
};

const TOOL_TYPE_LABELS: Record<number, string> = {
  [ToolType.Copilot]: "GitHub Copilot",
  [ToolType.Claude]: "Claude Code",
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

function normalizeTag(tag: TagDto): ArtifactTag | null {
  if (!tag.id) {
    return null;
  }

  const name = tag.name?.trim();
  if (!name) {
    return null;
  }

  return { id: tag.id, name };
}

function normalizeTool(tool: ToolTypeDto): ArtifactTool | null {
  if (!tool.id) {
    return null;
  }

  const label =
    tool.name?.trim() || TOOL_TYPE_LABELS[tool.id] || "Unknown tool";
  return { id: tool.id, label };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to process your request right now.";
}

export default function ArtifactDetailsModal({
  isOpen,
  onClose,
  artifactId,
  artifactType,
  artifactLabel,
  onAfterSave,
}: ArtifactDetailsModalProps) {
  const { showSuccess, showError: showErrorToast } = useToast();
  const userInfo = useUserInfo();
  const previousIsOpenRef = useRef(isOpen);

  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedToolTypes, setSelectedToolTypes] = useState<ToolType[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const artifactQuery = useQuery({
    queryKey: ["artifact-details", artifactId],
    queryFn: () => getPromptById(artifactId as string),
    enabled: isOpen && Boolean(artifactId),
  });

  const tagsQuery = useQuery({
    queryKey: ["artifact-tags"],
    queryFn: getTags,
    enabled: isOpen,
  });

  const toolTypesQuery = useQuery({
    queryKey: ["artifact-tool-types"],
    queryFn: getToolTypes,
    enabled: isOpen,
  });

  const artifact = artifactQuery.data;

  const availableTags = useMemo(
    () =>
      (tagsQuery.data ?? [])
        .map(normalizeTag)
        .filter((tag): tag is ArtifactTag => Boolean(tag)),
    [tagsQuery.data],
  );

  const toolLabels = useMemo(() => {
    if (!artifact?.toolTypes || artifact.toolTypes.length === 0) {
      return [];
    }

    return [
      ...new Set(
        artifact.toolTypes.map((toolType) => TOOL_TYPE_LABELS[toolType]),
      ),
    ].filter((label): label is string => Boolean(label));
  }, [artifact?.toolTypes]);

  const markdownContent = artifact?.content?.trim() ?? "";

  const renderedMarkdownContent = useMemo(() => {
    if (!markdownContent) {
      return "";
    }

    const parsedMarkdown = marked.parse(markdownContent, {
      gfm: true,
      breaks: true,
    }) as string;

    return DOMPurify.sanitize(parsedMarkdown);
  }, [markdownContent]);

  const availableTools = useMemo(() => {
    const normalizedFromApi = (toolTypesQuery.data ?? [])
      .map(normalizeTool)
      .filter((tool): tool is ArtifactTool => Boolean(tool));

    if (normalizedFromApi.length > 0) {
      return normalizedFromApi;
    }

    return [
      { id: ToolType.Copilot, label: TOOL_TYPE_LABELS[ToolType.Copilot] },
      { id: ToolType.Claude, label: TOOL_TYPE_LABELS[ToolType.Claude] },
    ];
  }, [toolTypesQuery.data]);

  const currentUserId =
    (userInfo as { id?: string; userId?: string } | null)?.id ??
    (userInfo as { id?: string; userId?: string } | null)?.userId ??
    null;

  const currentUserDisplayName =
    userInfo?.displayName?.trim().toLowerCase() ?? "";
  const authorDisplayName =
    artifact?.authorDisplayName?.trim().toLowerCase() ?? "";

  const isAuthor =
    Boolean(
      currentUserId &&
      artifact?.authorId &&
      currentUserId === artifact.authorId,
    ) ||
    Boolean(
      !currentUserId &&
      currentUserDisplayName &&
      authorDisplayName &&
      currentUserDisplayName === authorDisplayName,
    );

  useEffect(() => {
    if (!artifact || isEditMode) {
      return;
    }

    setTitle(artifact.name?.trim() ?? "");
    setDescription(artifact.description?.trim() ?? "");
    setContent(artifact.content?.trim() ?? "");
    setSelectedTagIds(
      (artifact.tags ?? [])
        .map((tag) => tag.id)
        .filter((id): id is string => Boolean(id)),
    );
    setSelectedToolTypes(artifact.toolTypes ?? []);
    setFieldErrors({});
  }, [artifact, isEditMode]);

  useEffect(() => {
    if (previousIsOpenRef.current && !isOpen) {
      setIsEditMode(false);
      setIsSaving(false);
      setFieldErrors({});
    }

    previousIsOpenRef.current = isOpen;
  }, [isOpen]);

  const setFieldError = (field: string, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((value) => value !== tagId)
        : [...prev, tagId],
    );
  };

  const handleToggleTool = (toolType: ToolType) => {
    setSelectedToolTypes((prev) =>
      prev.includes(toolType)
        ? prev.filter((value) => value !== toolType)
        : [...prev, toolType],
    );
  };

  const handleCancelEdit = () => {
    if (!artifact) {
      setIsEditMode(false);
      return;
    }

    setTitle(artifact.name?.trim() ?? "");
    setDescription(artifact.description?.trim() ?? "");
    setContent(artifact.content?.trim() ?? "");
    setSelectedTagIds(
      (artifact.tags ?? [])
        .map((tag) => tag.id)
        .filter((id): id is string => Boolean(id)),
    );
    setSelectedToolTypes(artifact.toolTypes ?? []);
    setFieldErrors({});
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!artifactId || !artifact) {
      return;
    }

    if (!isAuthor) {
      showErrorToast("Only the author can edit this artifact.");
      return;
    }

    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Title is required.";
    }

    if (!content.trim()) {
      errors.content = "Content is required.";
    }

    if (selectedToolTypes.length === 0) {
      errors.tools = "Select at least one compatible AI tool.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);

    try {
      const updatedArtifact = await updatePrompt(artifactId, {
        name: title.trim(),
        description: description.trim() || null,
        content: content.trim(),
        type: artifactType,
        tagIds: selectedTagIds,
        toolTypes: selectedToolTypes,
        isPublic: artifact.isPublic,
      });

      await artifactQuery.refetch();
      if (onAfterSave) {
        await onAfterSave();
      }

      setTitle(updatedArtifact.name?.trim() ?? "");
      setDescription(updatedArtifact.description?.trim() ?? "");
      setContent(updatedArtifact.content?.trim() ?? "");
      setSelectedTagIds(
        (updatedArtifact.tags ?? [])
          .map((tag) => tag.id)
          .filter((id): id is string => Boolean(id)),
      );
      setSelectedToolTypes(updatedArtifact.toolTypes ?? []);
      setFieldErrors({});
      setIsEditMode(false);
      showSuccess(`${artifactLabel} updated successfully`);
    } catch (error) {
      setFieldError("form", getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = artifact?.name?.trim() || `${artifactLabel} Details`;
  const metadataAuthor = artifact?.authorDisplayName?.trim() || "Unknown author";
  const metadataPublishedAt = toReadableTimestamp(artifact?.createdAt);
  const metadataUpdatedAt = toReadableTimestamp(
    artifact?.updatedAt ?? artifact?.createdAt,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="artifact-details-modal-title"
    >
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        maxH="calc(100vh - 4rem)"
        w={{ sm: "90%", md: "80%", lg: "720px" }}
        column
        gap={3}
        bg="white"
      >
        <Box column gap={0.75} px={2} pt={2}>
          <Heading id="artifact-details-modal-title" as="h2">
            {modalTitle}
          </Heading>

          {!isEditMode && artifact ? (
            <Box
              w={1}
              column
              gap={0.25}
              aria-label="Artifact metadata"
            >
              <Box gap={0.5} alignItems="baseline">
                <T color="neutral.textSecondary" fontWeight="semibold">
                  Author
                </T>
                <T color="neutral.textSecondary">{metadataAuthor}</T>
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

        {artifactQuery.isPending ? (
          <Box w={1} justifyContent="center" py={6}>
            <Spinner
              aria-label={`Loading ${artifactLabel.toLowerCase()} details`}
            />
          </Box>
        ) : artifactQuery.isError ? (
          <Box column gap={2} px={2} pb={2}>
            <Message variant="error">Unable to load artifact details.</Message>
            <Box w={1} justifyContent="flex-end" gap={2}>
              <Button
                variant="secondaryDark"
                onClick={() => void artifactQuery.refetch()}
              >
                Retry
              </Button>
              <Button variant="secondaryDark" onClick={onClose}>
                Close
              </Button>
            </Box>
          </Box>
        ) : artifact ? (
          <>
            <Box column overflow="auto" gap={3} py={2} px={2}>
              {!isEditMode ? (
                <>
                  <Box column gap={1}>
                    <T fontWeight="semibold">Description</T>
                    <P color="neutral.textSecondary">
                      {artifact.description?.trim() ||
                        "No description provided."}
                    </P>
                  </Box>

                  <Box column gap={1.5}>
                    <T fontWeight="semibold">Compatible AI Tools</T>
                    <Box w={1} flexWrap="wrap" gap={1.5}>
                      {toolLabels.length > 0 ? (
                        toolLabels.map((toolLabel) => (
                          <Tag
                            key={toolLabel}
                            text={toolLabel}
                            variant="subtleBlue"
                          />
                        ))
                      ) : (
                        <P color="neutral.textSecondary">No tools listed.</P>
                      )}
                    </Box>
                  </Box>

                  <Box column gap={1.5}>
                    <T fontWeight="semibold">Tags</T>
                    <Box w={1} flexWrap="wrap" gap={1.5}>
                      {artifact.tags && artifact.tags.length > 0 ? (
                        artifact.tags.map((tag) => (
                          <Tag
                            key={tag.id}
                            text={tag.name?.trim() || "Untitled tag"}
                            variant="subtleGrey"
                          />
                        ))
                      ) : (
                        <P color="neutral.textSecondary">No tags added.</P>
                      )}
                    </Box>
                  </Box>

                  <Box column gap={1}>
                    <T fontWeight="semibold">Content</T>
                    {markdownContent ? (
                      <Prose
                        p={2}
                        maxH="360px"
                        overflow="auto"
                        dangerouslySetInnerHTML={{
                          __html: renderedMarkdownContent,
                        }}
                      />
                    ) : (
                      <P color="neutral.textSecondary">No content provided.</P>
                    )}
                  </Box>

                </>
              ) : (
                <>
                  {fieldErrors.form ? (
                    <Message variant="error">{fieldErrors.form}</Message>
                  ) : null}

                  <Box column gap={1}>
                    <Label htmlFor="details-title" text="Title *" />
                    <Input
                      id="details-title"
                      value={title}
                      onChange={(event) => {
                        setTitle(event.target.value);
                        clearFieldError("title");
                      }}
                      isInvalid={Boolean(fieldErrors.title)}
                    />
                    {fieldErrors.title ? (
                      <Message variant="error">{fieldErrors.title}</Message>
                    ) : null}
                  </Box>

                  <Box column gap={1}>
                    <Label htmlFor="details-description" text="Description" />
                    <Textarea
                      id="details-description"
                      rows={3}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </Box>

                  <Box column gap={1.5}>
                    <T fontWeight="semibold">Compatible AI Tools *</T>
                    <Box w={1} flexWrap="wrap" gap={1.5}>
                      {availableTools.map((tool) => (
                        <Tag
                          key={tool.id}
                          text={tool.label}
                          isInteractive
                          onClick={() => {
                            handleToggleTool(tool.id);
                            clearFieldError("tools");
                          }}
                          variant={
                            selectedToolTypes.includes(tool.id)
                              ? "subtleBlue"
                              : "subtleGrey"
                          }
                        />
                      ))}
                    </Box>
                    {fieldErrors.tools ? (
                      <Message variant="error">{fieldErrors.tools}</Message>
                    ) : null}
                  </Box>

                  <Box column gap={1.5}>
                    <T fontWeight="semibold">Tags</T>
                    <Box w={1} flexWrap="wrap" gap={1.5}>
                      {availableTags.map((tag) => (
                        <Tag
                          key={tag.id}
                          text={tag.name}
                          isInteractive
                          onClick={() => handleToggleTag(tag.id)}
                          variant={
                            selectedTagIds.includes(tag.id)
                              ? "subtleBlue"
                              : "subtleGrey"
                          }
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box column gap={1}>
                    <Label
                      htmlFor="details-content"
                      text="Content / Instructions *"
                    />
                    <Textarea
                      id="details-content"
                      rows={12}
                      value={content}
                      onChange={(event) => {
                        setContent(event.target.value);
                        clearFieldError("content");
                      }}
                      isInvalid={Boolean(fieldErrors.content)}
                    />
                    {fieldErrors.content ? (
                      <Message variant="error">{fieldErrors.content}</Message>
                    ) : null}
                  </Box>
                </>
              )}
            </Box>

            <Box w={1} justifyContent="flex-end" gap={2} px={2} pb={2}>
              {isEditMode ? (
                <>
                  <Button
                    variant="secondaryDark"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primaryDark"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondaryDark" onClick={onClose}>
                    Close
                  </Button>
                  {isAuthor ? (
                    <Button
                      variant="primaryDark"
                      onClick={() => setIsEditMode(true)}
                    >
                      Edit
                    </Button>
                  ) : null}
                </>
              )}
            </Box>
          </>
        ) : (
          <Box column gap={2} px={2} pb={2}>
            <Message variant="error">Artifact was not found.</Message>
            <Box w={1} justifyContent="flex-end">
              <Button variant="secondaryDark" onClick={onClose}>
                Close
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
}
