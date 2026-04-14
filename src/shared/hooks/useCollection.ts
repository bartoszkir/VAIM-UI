import { useCallback, useEffect, useState } from "react";

const COLLECTION_STORAGE_KEY = "vaim-collection";

export function useCollection() {
  const [collection, setCollection] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(COLLECTION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCollection(new Set(parsed));
      } catch {
        // Silently fail if localStorage is corrupted
        localStorage.removeItem(COLLECTION_STORAGE_KEY);
      }
    }
    setIsHydrated(true);
  }, []);

  // Sync to localStorage whenever collection changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        COLLECTION_STORAGE_KEY,
        JSON.stringify(Array.from(collection)),
      );
    }
  }, [collection, isHydrated]);

  const addToCollection = useCallback((artifactId: string) => {
    setCollection((prev) => {
      const updated = new Set(prev);
      updated.add(artifactId);
      return updated;
    });
  }, []);

  const removeFromCollection = useCallback((artifactId: string) => {
    setCollection((prev) => {
      const updated = new Set(prev);
      updated.delete(artifactId);
      return updated;
    });
  }, []);

  const clearCollection = useCallback(() => {
    setCollection(new Set());
  }, []);

  const isInCollection = useCallback(
    (artifactId: string) => {
      return collection.has(artifactId);
    },
    [collection],
  );

  const toggleInCollection = useCallback(
    (artifactId: string) => {
      if (isInCollection(artifactId)) {
        removeFromCollection(artifactId);
      } else {
        addToCollection(artifactId);
      }
    },
    [isInCollection, addToCollection, removeFromCollection],
  );

  return {
    collection,
    addToCollection,
    removeFromCollection,
    clearCollection,
    isInCollection,
    toggleInCollection,
  };
}
