import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTag, deleteTag, getTags, updateTag } from "../../api/tags";
import type { TagCreateRequest, TagUpdateRequest } from "../../api/types";

export const artifactTagsQueryKey = ["artifact-tags"] as const;

type ArtifactTagOption = {
  id: string;
  name: string;
};

function toTagOption(tag: {
  id: string;
  name?: string | null;
}): ArtifactTagOption | null {
  if (!tag.id) {
    return null;
  }

  const name = tag.name?.trim();
  if (!name) {
    return null;
  }

  return { id: tag.id, name };
}

async function invalidateArtifactQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: artifactTagsQueryKey }),
    queryClient.invalidateQueries({ queryKey: ["artifacts"] }),
    queryClient.invalidateQueries({ queryKey: ["artifact-details"] }),
  ]);
}

export function useArtifactTags() {
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: artifactTagsQueryKey,
    queryFn: getTags,
  });

  const tags = useMemo(
    () =>
      (tagsQuery.data ?? [])
        .map(toTagOption)
        .filter((tag): tag is ArtifactTagOption => Boolean(tag))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tagsQuery.data],
  );

  const tagsById = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag.name])),
    [tags],
  );

  const createTagMutation = useMutation({
    mutationFn: (request: TagCreateRequest) => createTag(request),
    onSuccess: async () => {
      await invalidateArtifactQueries(queryClient);
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: TagUpdateRequest }) =>
      updateTag(id, request),
    onSuccess: async () => {
      await invalidateArtifactQueries(queryClient);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: async () => {
      await invalidateArtifactQueries(queryClient);
    },
  });

  return {
    tags,
    tagsById,
    tagsQuery,
    createTagMutation,
    updateTagMutation,
    deleteTagMutation,
  };
}

export type { ArtifactTagOption };
