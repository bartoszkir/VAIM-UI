import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Box,
  Heading,
  Label,
  Input,
  Textarea,
  T,
  Tag,
  Button,
  P,
} from "@veracity/vui";
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

type UploadArtifactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  artifactType: PromptType;
  artifactLabel: string;
  availableTools: UploadToolOption[];
  availableTags: Array<string | ArtifactTag>;
  onAfterCreate?: (payload: UploadAfterCreatePayload) => void | Promise<void>;
};

export default function UploadArtifactModal({
  isOpen,
  onClose,
  artifactType,
  artifactLabel,
  availableTools,
  availableTags,
  onAfterCreate,
}: UploadArtifactModalProps) {
  const { showSuccess } = useToast();
  const prevIsOpenRef = useRef(isOpen);

  const [uploadMode, setUploadMode] = useState<UploadMode>(UploadMode.Manual);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [selectedTools, setSelectedTools] = useState<ToolType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [markdownFile, setMarkdownFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedTags: ArtifactTag[] = availableTags.map((tag) =>
    typeof tag === "string" ? { id: tag, name: tag } : tag,
  );

  const resetUploadForm = () => {
    setUploadMode(UploadMode.Manual);
    setTitle("");
    setDescription("");
    setContent("");
    setSelectedTools([]);
    setSelectedTags([]);
    setMarkdownFile(null);
    setSubmitError(null);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      resetUploadForm();
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    setSubmitError(null);
  }, [uploadMode]);

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

    setSubmitError(null);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((value) => value !== tagId)
        : [...prev, tagId],
    );
  };

  const handleManualUpload = async () => {
    if (selectedTools.length === 0) {
      setSubmitError("Select at least one compatible AI tool.");
      return;
    }

    if (!title.trim()) {
      setSubmitError("Title is required.");
      return;
    }

    if (!content.trim()) {
      setSubmitError("Content is required.");
      return;
    }

    setSubmitError(null);
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

      showSuccess(`${artifactLabel} uploaded successfully`);
      onClose();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkdownUpload = async () => {
    if (selectedTools.length === 0) {
      setSubmitError("Select at least one compatible AI tool.");
      return;
    }

    if (!markdownFile) {
      setSubmitError("Select a markdown file to continue.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const markdownText = await markdownFile.text();
      if (!markdownText.trim()) {
        setSubmitError("Markdown file is empty.");
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

      showSuccess(`${artifactLabel} created from markdown`);
      onClose();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
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
      aria-labelledby={`upload-${artifactLabel.toLowerCase()}-modal-title`}
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
        <Heading
          id={`upload-${artifactLabel.toLowerCase()}-modal-title`}
          as="h2"
          px={2}
          pt={2}
        >
          Upload New {artifactLabel}
        </Heading>

        <Box column overflow="auto" gap={3} py={2} px={2}>
          <Box column gap={1.5}>
            <T fontWeight="semibold">Creation Mode</T>
            <Box w={1} flexWrap="wrap" gap={1.5}>
              <Tag
                text="Manual form"
                isInteractive
                onClick={() => setUploadMode(UploadMode.Manual)}
                variant={
                  uploadMode === UploadMode.Manual ? "subtleBlue" : "subtleGrey"
                }
              />
              <Tag
                text="Markdown file"
                isInteractive
                onClick={() => setUploadMode(UploadMode.Markdown)}
                variant={
                  uploadMode === UploadMode.Markdown
                    ? "subtleBlue"
                    : "subtleGrey"
                }
              />
            </Box>
          </Box>

          <Box column gap={1.5}>
            <T fontWeight="semibold">Compatible AI Tools</T>
            <Box w={1} flexWrap="wrap" gap={1.5}>
              {availableTools.map((tool) => (
                <Tag
                  key={tool.id}
                  text={tool.label}
                  isInteractive
                  onClick={() => handleToggleTool(tool.id)}
                  variant={
                    selectedTools.includes(tool.id)
                      ? "subtleBlue"
                      : "subtleGrey"
                  }
                />
              ))}
            </Box>
          </Box>

          {uploadMode === UploadMode.Manual ? (
            <>
              <Box column gap={1}>
                <Label htmlFor="upload-title" text="Title" />
                <Input
                  id="upload-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter a descriptive title"
                />
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
                <Label htmlFor="upload-content" text="Content / Instructions" />
                <Textarea
                  id="upload-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Paste your artifact content here..."
                  rows={5}
                />
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
            </>
          ) : (
            <Box column gap={1}>
              <Label htmlFor="upload-markdown-file" text="Markdown file" />
              <input
                id="upload-markdown-file"
                type="file"
                accept=".md,text/markdown"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] ?? null;
                  setMarkdownFile(selectedFile);
                }}
                disabled={isSubmitting}
              />
              <P color="neutral.textSecondary">
                Upload a markdown file and the backend will infer artifact data.
              </P>
            </Box>
          )}

          {submitError ? <P color="error.text">{submitError}</P> : null}
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
            {isSubmitting
              ? "Uploading..."
              : uploadMode === UploadMode.Manual
                ? "Upload"
                : "Create From Markdown"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
