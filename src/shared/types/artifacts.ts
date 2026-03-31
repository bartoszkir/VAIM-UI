export type ArtifactItem = {
  id: string;
  title: string;
  author: string;
  publishedAt: string;
  description: string;
  tools: string[];
  tags: string[];
  favorites: number;
  isFavorite: boolean;
  comments: number;
  updatedAt: string;
};
