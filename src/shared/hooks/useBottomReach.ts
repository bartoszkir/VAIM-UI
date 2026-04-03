import { useEffect, useRef } from "react";

type UseBottomReachParams = {
  enabled: boolean;
  onReachBottom: () => void;
  rootMargin?: string;
  threshold?: number;
};

export function useBottomReach({
  enabled,
  onReachBottom,
  rootMargin = "0px 0px 240px 0px",
  threshold = 0,
}: UseBottomReachParams) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !enabled) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onReachBottom();
            break;
          }
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [enabled, onReachBottom, rootMargin, threshold]);

  return targetRef;
}
