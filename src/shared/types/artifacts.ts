export type ArtifactItem = {
  id: string;
  title: string;
  author: string;
  publishedDaysAgo: number;
  description: string;
  tools: string[];
  tags: string[];
  favorites: number;
  comments: number;
  updatedDaysAgo: number;
};
