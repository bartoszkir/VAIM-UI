import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  Grid,
  Heading,
  Input,
  Label,
  Message,
  P,
  Spinner,
  Tag,
  useToast,
} from "@veracity/vui";
import { HttpError } from "../../api/httpClient";
import ArtifactPageHeader from "../../shared/components/ArtifactPageHeader";
import {
  useArtifactTags,
  type ArtifactTagOption,
} from "../../shared/hooks/useArtifactTags";

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to process your request right now.";
}

export default function TagsPage() {
  const { showSuccess, showError } = useToast();
  const {
    tags,
    tagsQuery,
    createTagMutation,
    updateTagMutation,
    deleteTagMutation,
  } = useArtifactTags();

  const [searchValue, setSearchValue] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingTag, setEditingTag] = useState<ArtifactTagOption | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingTag, setDeletingTag] = useState<ArtifactTagOption | null>(
    null,
  );

  const filteredTags = useMemo(() => {
    const needle = searchValue.trim().toLowerCase();
    if (!needle) {
      return tags;
    }

    return tags.filter((tag) => tag.name.toLowerCase().includes(needle));
  }, [searchValue, tags]);

  const isCreatePending = createTagMutation.isPending;
  const isEditPending = updateTagMutation.isPending;
  const isDeletePending = deleteTagMutation.isPending;

  const openEditModal = (tag: ArtifactTagOption) => {
    setEditingTag(tag);
    setEditingName(tag.name);
    setEditError(null);
  };

  const handleCreate = async () => {
    const value = newTagName.trim();
    if (!value) {
      setCreateError("Tag name is required.");
      return;
    }

    if (tags.some((tag) => tag.name.toLowerCase() === value.toLowerCase())) {
      setCreateError("A tag with this name already exists.");
      return;
    }

    setCreateError(null);

    try {
      await createTagMutation.mutateAsync({ name: value });
      setNewTagName("");
      showSuccess("Tag created");
    } catch (error) {
      setCreateError(getErrorMessage(error));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTag) {
      return;
    }

    const value = editingName.trim();
    if (!value) {
      setEditError("Tag name is required.");
      return;
    }

    if (
      tags.some(
        (tag) =>
          tag.id !== editingTag.id &&
          tag.name.toLowerCase() === value.toLowerCase(),
      )
    ) {
      setEditError("A tag with this name already exists.");
      return;
    }

    setEditError(null);

    try {
      await updateTagMutation.mutateAsync({
        id: editingTag.id,
        request: { name: value },
      });
      setEditingTag(null);
      showSuccess("Tag updated");
    } catch (error) {
      setEditError(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingTag) {
      return;
    }

    try {
      await deleteTagMutation.mutateAsync(deletingTag.id);
      showSuccess("Tag deleted");
      setDeletingTag(null);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  return (
    <Box column w={1} p={{ xs: 3, md: 4 }} gap={3}>
      <ArtifactPageHeader
        title="Tags"
        subtitle="Manage reusable tags for prompts, skills, agents, and instructions."
        uploadButtonLabel=""
        onUpload={() => {}}
      />

      <Card w={1} p={{ xs: 3, md: 4 }} column gap={2}>
        <Box w={1} justifyContent="space-between" alignItems="center" gap={2}>
          <Heading as="h2">Tag Library</Heading>
          <Box gap={2} alignItems="center">
            <Input
              id="tags-search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search tags..."
            />
            <P color="neutral.textSecondary" alignSelf="flex-end">
              {filteredTags.length} tags
            </P>
          </Box>
        </Box>

        {tagsQuery.isPending ? (
          <Box w={1} justifyContent="center" py={4}>
            <Spinner aria-label="Loading tags" />
          </Box>
        ) : tagsQuery.isError ? (
          <Box column gap={2} py={2}>
            <Message variant="error">Unable to load tags right now.</Message>
            <Box>
              <Button
                variant="secondaryDark"
                onClick={() => void tagsQuery.refetch()}
              >
                Retry
              </Button>
            </Box>
          </Box>
        ) : (
          <Grid
            w={1}
            gap={3}
            gridTemplateColumns={{
              sm: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            }}
          >
            <Card
              p={3}
              gap={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Input
                id="tags-new-name"
                value={newTagName}
                onChange={(event) => {
                  setNewTagName(event.target.value);
                  if (createError) {
                    setCreateError(null);
                  }
                }}
                placeholder="Add a new tag name"
                isInvalid={Boolean(createError)}
              />
              {createError ? (
                <Message variant="error">{createError}</Message>
              ) : null}
              <Button
                variant="primaryDark"
                onClick={() => void handleCreate()}
                disabled={isCreatePending}
              >
                Create
              </Button>
            </Card>
            {filteredTags.map((tag) => (
              <Card
                key={tag.id}
                p={3}
                gap={2}
                alignItems="center"
                justifyContent="space-between"
              >
                <Tag text={tag.name} variant="subtleGrey" />
                <Box gap={1.5}>
                  <Button
                    variant="secondaryDark"
                    onClick={() => openEditModal(tag)}
                    disabled={isEditPending || isDeletePending}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="secondaryDark"
                    onClick={() => setDeletingTag(tag)}
                    disabled={isEditPending || isDeletePending}
                  >
                    Delete
                  </Button>
                </Box>
              </Card>
            ))}
          </Grid>
        )}
      </Card>

      <Dialog
        isOpen={Boolean(editingTag)}
        onClose={() => setEditingTag(null)}
        aria-labelledby="tag-edit-dialog-title"
        p={3}
      >
        <Heading id="tag-edit-dialog-title" as="h2">
          Rename Tag
        </Heading>

        <Box column gap={1} mb={2}>
          <Label htmlFor="tag-edit-name">Tag name</Label>
          <Input
            id="tag-edit-name"
            value={editingName}
            onChange={(event) => {
              setEditingName(event.target.value);
              if (editError) {
                setEditError(null);
              }
            }}
            isInvalid={Boolean(editError)}
            errorText={editError || undefined}
          />
        </Box>

        <Box w={1} justifyContent="flex-end" gap={2}>
          <Button
            variant="secondaryDark"
            onClick={() => setEditingTag(null)}
            disabled={isEditPending}
          >
            Cancel
          </Button>
          <Button
            variant="primaryDark"
            onClick={() => void handleSaveEdit()}
            disabled={isEditPending}
          >
            Confirm
          </Button>
        </Box>
      </Dialog>

      <Dialog
        isOpen={Boolean(deletingTag)}
        onClose={() => setDeletingTag(null)}
        aria-labelledby="tag-delete-dialog-title"
        p={3}
      >
        <Heading id="tag-delete-dialog-title" as="h2">
          Delete Tag
        </Heading>

        <P>
          Delete <strong>{deletingTag?.name}</strong>? This cannot be undone.
        </P>

        <Box w={1} justifyContent="flex-end" gap={2}>
          <Button
            variant="secondaryDark"
            onClick={() => setDeletingTag(null)}
            disabled={isDeletePending}
          >
            Cancel
          </Button>
          <Button
            variant="primaryDark"
            onClick={() => void handleDelete()}
            disabled={isDeletePending}
          >
            Delete
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
