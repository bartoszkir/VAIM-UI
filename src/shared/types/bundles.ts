export type BundleArtifactItem = {
  id: string;
  title: string;
  description: string;
  typeLabel: string;
  tools: string[];
  tags: string[];
};

export type BundleItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  tools: string[];
  tags: string[];
  artifactCount: number;
  artifacts: BundleArtifactItem[];
  isDynamic: boolean;
};
