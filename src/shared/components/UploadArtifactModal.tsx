import { useState, useEffect, useRef } from "react";
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
} from "@veracity/vui";
import { useToast } from "@veracity/vui";

type UploadArtifactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  artifactLabel: string;
  availableTools: string[];
  availableTags: string[];
};

export default function UploadArtifactModal({
  isOpen,
  onClose,
  artifactLabel,
  availableTools,
  availableTags,
}: UploadArtifactModalProps) {
  const { showSuccess } = useToast();
  const prevIsOpenRef = useRef(isOpen);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Reset form when modal closes (transitions from open to closed)
  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      // Transitioning from open to closed - reset form
      const resetForm = () => {
        setTitle("");
        setDescription("");
        setContent("");
        setSelectedTools([]);
        setSelectedTags([]);
      };
      resetForm();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const handleToggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleUpload = () => {
    showSuccess(`${artifactLabel} uploaded successfully`);
    onClose();
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
          {/* Title field */}
          <Box column gap={1}>
            <Label htmlFor="upload-title" text="Title" />
            <Input
              id="upload-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
            />
          </Box>

          {/* Description field */}
          <Box column gap={1}>
            <Label htmlFor="upload-description" text="Description" />
            <Textarea
              id="upload-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this artifact does and when to use it"
              rows={3}
            />
          </Box>

          {/* Content field */}
          <Box column gap={1}>
            <Label htmlFor="upload-content" text="Content / Instructions" />
            <Textarea
              id="upload-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your artifact content here..."
              rows={5}
            />
          </Box>

          {/* Compatible AI Tools */}
          <Box column gap={1.5}>
            <T fontWeight="semibold">Compatible AI Tools</T>
            <Box w={1} flexWrap="wrap" gap={1.5}>
              {availableTools.map((tool) => (
                <Tag
                  key={tool}
                  text={tool}
                  isInteractive
                  onClick={() => handleToggleTool(tool)}
                  variant={
                    selectedTools.includes(tool) ? "subtleBlue" : "subtleGrey"
                  }
                />
              ))}
            </Box>
          </Box>

          {/* Tags */}
          <Box column gap={1.5}>
            <T fontWeight="semibold">Tags</T>
            <Box w={1} flexWrap="wrap" gap={1.5}>
              {availableTags.map((tag) => (
                <Tag
                  key={tag}
                  text={tag}
                  isInteractive
                  onClick={() => handleToggleTag(tag)}
                  variant={
                    selectedTags.includes(tag) ? "subtleBlue" : "subtleGrey"
                  }
                />
              ))}
            </Box>
          </Box>
        </Box>
        {/* Action buttons */}
        <Box w={1} justifyContent="flex-end" gap={2} px={2} pb={2}>
          <Button variant="secondaryDark" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primaryDark" onClick={handleUpload}>
            Upload
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
