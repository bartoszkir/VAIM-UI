import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Modal,
  Box,
  Heading,
  Label,
  Input,
  Textarea,
  T,
  Tag,
  Tab,
  Tabs,
  Button,
  P,
  Prose,
  Message,
} from "@veracity/vui";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useToast } from "@veracity/vui";
import { createPrompt, createPromptFromMarkdown } from "../../api/prompts";
import { HttpError } from "../../api/httpClient";
import type { PromptDto, PromptType, ToolType } from "../../api/types";

const UploadMode = {
  Manual: "manual",
  Markdown: "markdown",
} as const;

type UploadMode = (typeof UploadMode)[keyof typeof UploadMode];

type ArtifactTag = {
  id: string;
  name: string;
};

type UploadAfterCreatePayload = {
  mode: UploadMode;
  artifact: PromptDto;
};

type UploadToolOption = {
  id: ToolType;
  label: string;
};

type UploadArtifactTypeOption = {
  id: PromptType;
  label: string;
};

type UploadArtifactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  artifactTypeOptions: UploadArtifactTypeOption[];
  availableTools: UploadToolOption[];
  availableTags: Array<string | ArtifactTag>;
  onAfterCreate?: (payload: UploadAfterCreatePayload) => void | Promise<void>;
};

export default function UploadArtifactModal({
  isOpen,
  onClose,
  artifactTypeOptions,
  availableTools,
  availableTags,
  onAfterCreate,
}: UploadArtifactModalProps) {
  const { showSuccess, showError: showErrorToast } = useToast();
  const prevIsOpenRef = useRef(isOpen);

  const [uploadMode, setUploadMode] = useState<UploadMode>(UploadMode.Manual);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [selectedArtifactType, setSelectedArtifactType] =
    useState<PromptType | null>(null);
  const [selectedTools, setSelectedTools] = useState<ToolType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [markdownFile, setMarkdownFile] = useState<File | null>(null);
  const [markdownPreviewText, setMarkdownPreviewText] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const renderedMarkdownPreview = useMemo(() => {
    if (!markdownPreviewText.trim()) {
      return "";
    }

    const parsedMarkdown = marked.parse(markdownPreviewText, {
      gfm: true,
      breaks: true,
    }) as string;

    return DOMPurify.sanitize(parsedMarkdown);
  }, [markdownPreviewText]);

  const normalizedTags: ArtifactTag[] = availableTags.map((tag) =>
    typeof tag === "string" ? { id: tag, name: tag } : tag,
  );

  const resetUploadForm = () => {
    setUploadMode(UploadMode.Manual);
    setTitle("");
    setDescription("");
    setContent("");
    setSelectedArtifactType(null);
    setSelectedTools([]);
    setSelectedTags([]);
    setMarkdownFile(null);
    setMarkdownPreviewText("");
    setPreviewError(null);
    setIsSubmitting(false);
    setFieldErrors({});
  };

  const setFieldError = (field: string, error: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      resetUploadForm();
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof HttpError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Unable to upload artifact right now.";
  };

  const handleToggleTool = (tool: ToolType) => {
    setSelectedTools((prev) =>
      prev.includes(tool)
        ? prev.filter((value) => value !== tool)
        : [...prev, tool],
    );
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((value) => value !== tagId)
        : [...prev, tagId],
    );
  };

  const selectedArtifactTypeLabel =
    artifactTypeOptions.find((option) => option.id === selectedArtifactType)
      ?.label ?? "Artifact";

  const handleManualUpload = async () => {
    const errors: Record<string, string> = {};

    if (!selectedArtifactType) {
      errors.type = "Select an artifact type.";
    }

    if (selectedTools.length === 0) {
      errors.tools = "Select at least one compatible AI tool.";
    }

    if (!title.trim()) {
      errors.title = "Title is required.";
    }

    if (!content.trim()) {
      errors.content = "Content is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const artifactType = selectedArtifactType;
    if (!artifactType) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createdArtifact = await createPrompt({
        name: title.trim(),
        description: description.trim() || null,
        content: content.trim(),
        type: artifactType,
        tagIds: selectedTags.length > 0 ? selectedTags : null,
        toolTypes: selectedTools,
      });

      if (onAfterCreate) {
        await onAfterCreate({
          mode: UploadMode.Manual,
          artifact: createdArtifact,
        });
      }

      showSuccess(`${selectedArtifactTypeLabel} uploaded successfully`);
      onClose();
    } catch (error) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkdownUpload = async () => {
    const errors: Record<string, string> = {};

    if (!selectedArtifactType) {
      errors.type = "Select an artifact type.";
    }

    if (selectedTools.length === 0) {
      errors.tools = "Select at least one compatible AI tool.";
    }

    if (!markdownFile) {
      errors.file = "Select a markdown file to continue.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const artifactType = selectedArtifactType;
    if (!artifactType) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!markdownFile) {
        setFieldError("file", "Markdown file is required.");
        setIsSubmitting(false);
        return;
      }

      const markdownText = await markdownFile.text();
      if (!markdownText.trim()) {
        setFieldError("file", "Markdown file is empty.");
        return;
      }

      const createdArtifact = await createPromptFromMarkdown({
        markdownText,
        type: artifactType,
        toolTypes: selectedTools,
      });

      if (onAfterCreate) {
        await onAfterCreate({
          mode: UploadMode.Markdown,
          artifact: createdArtifact,
        });
      }

      showSuccess(`${selectedArtifactTypeLabel} created from markdown`);
      onClose();
    } catch (error) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkdownFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setMarkdownFile(selectedFile);
    clearFieldError("file");
    setPreviewError(null);

    if (!selectedFile) {
      setMarkdownPreviewText("");
      return;
    }

    try {
      const markdownText = await selectedFile.text();
      setMarkdownPreviewText(markdownText);

      if (!markdownText.trim()) {
        setPreviewError("Selected file is empty. Add content to preview it.");
      }
    } catch {
      setMarkdownPreviewText("");
      setPreviewError("Unable to read the selected markdown file.");
    }
  };

  const handleUpload = async () => {
    if (isSubmitting) {
      return;
    }

    if (uploadMode === UploadMode.Markdown) {
      await handleMarkdownUpload();
      return;
    }

    await handleManualUpload();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="upload-artifact-modal-title"
    >
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        maxH="calc(100vh - 4rem)"
        w={{ sm: "90%", md: "80%", lg: "600px" }}
        column
        gap={4}
        bg="white"
      >
        <Heading id="upload-artifact-modal-title" as="h2" px={2} pt={2}>
          Upload New Artifact
        </Heading>

        <Box column overflow="auto" gap={3} py={2} px={2}>
          <Box column gap={1.5}>
            <T fontWeight="semibold">Artifact type *</T>
            <Box w={1} flexWrap="wrap" gap={1.5}>
              {artifactTypeOptions.map((artifactTypeOption) => (
                <Tag
                  key={artifactTypeOption.id}
                  text={artifactTypeOption.label}
                  isInteractive
                  onClick={() => {
                    setSelectedArtifactType(artifactTypeOption.id);
                    clearFieldError("type");
                  }}
                  variant={
                    selectedArtifactType === artifactTypeOption.id
                      ? "subtleBlue"
                      : "subtleGrey"
                  }
                />
              ))}
            </Box>
            {fieldErrors.type ? (
              <Message id="type-error" variant="error">
                {fieldErrors.type}
              </Message>
            ) : null}
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
                    selectedTools.includes(tool.id)
                      ? "subtleBlue"
                      : "subtleGrey"
                  }
                />
              ))}
            </Box>
            {fieldErrors.tools ? (
              <Message id="tools-error" variant="error">
                {fieldErrors.tools}
              </Message>
            ) : null}
          </Box>

          <Box column gap={1.5}>
            <Tabs
              activeTabId={uploadMode}
              onTabClick={(id) => {
                if (id === UploadMode.Manual || id === UploadMode.Markdown) {
                  setUploadMode(id);
                }
              }}
            >
              <Tab id={UploadMode.Manual} title="Manual form">
                <Box column gap={2}>
                  <Box column gap={1}>
                    <Label htmlFor="upload-title" text="Title *" />
                    <Input
                      id="upload-title"
                      value={title}
                      onChange={(event) => {
                        setTitle(event.target.value);
                        clearFieldError("title");
                      }}
                      placeholder="Enter a descriptive title"
                      isInvalid={!!fieldErrors.title}
                    />
                    {fieldErrors.title ? (
                      <Message id="title-error" variant="error">
                        {fieldErrors.title}
                      </Message>
                    ) : null}
                  </Box>

                  <Box column gap={1}>
                    <Label htmlFor="upload-description" text="Description" />
                    <Textarea
                      id="upload-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe what this artifact does and when to use it"
                      rows={3}
                    />
                  </Box>

                  <Box column gap={1}>
                    <Label
                      htmlFor="upload-content"
                      text="Content / Instructions *"
                    />
                    <Textarea
                      id="upload-content"
                      value={content}
                      onChange={(event) => {
                        setContent(event.target.value);
                        clearFieldError("content");
                      }}
                      placeholder="Paste your artifact content here..."
                      rows={5}
                      isInvalid={!!fieldErrors.content}
                    />
                    {fieldErrors.content ? (
                      <Message id="content-error" variant="error">
                        {fieldErrors.content}
                      </Message>
                    ) : null}
                  </Box>

                  <Box column gap={1.5}>
                    <T fontWeight="semibold">Tags</T>
                    <Box w={1} flexWrap="wrap" gap={1.5}>
                      {normalizedTags.map((tag) => (
                        <Tag
                          key={tag.id}
                          text={tag.name}
                          isInteractive
                          onClick={() => handleToggleTag(tag.id)}
                          variant={
                            selectedTags.includes(tag.id)
                              ? "subtleBlue"
                              : "subtleGrey"
                          }
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Tab>

              <Tab id={UploadMode.Markdown} title="Markdown file">
                <Box column gap={2}>
                  <Box column gap={1}>
                    <Label
                      htmlFor="upload-markdown-file"
                      text="Markdown file *"
                    />
                    <input
                      id="upload-markdown-file"
                      type="file"
                      accept=".md,text/markdown"
                      onChange={(event) => {
                        void handleMarkdownFileChange(event);
                      }}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.file ? (
                      <Message id="file-error" variant="error">
                        {fieldErrors.file}
                      </Message>
                    ) : null}
                    <P color="neutral.textSecondary">
                      Upload a markdown file and the backend will infer artifact
                      data.
                    </P>

                    {markdownFile ? (
                      <Box column gap={1}>
                        <T fontWeight="semibold">Preview</T>
                        {previewError ? (
                          <Message variant="error">{previewError}</Message>
                        ) : null}
                        {renderedMarkdownPreview ? (
                          <Prose
                            p={2}
                            maxH="260px"
                            overflow="auto"
                            borderRadius={1}
                            border="1px solid"
                            borderColor="neutral.borderLow"
                            dangerouslySetInnerHTML={{
                              __html: renderedMarkdownPreview,
                            }}
                          />
                        ) : (
                          <P color="neutral.textSecondary">
                            Preview unavailable for this file.
                          </P>
                        )}
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              </Tab>
            </Tabs>
          </Box>
        </Box>

        <Box w={1} justifyContent="flex-end" gap={2} px={2} pb={2}>
          <Button
            variant="secondaryDark"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primaryDark"
            onClick={() => void handleUpload()}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Uploading..." : "Upload"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
