import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

type PrefetchOptions<T> = {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  staleTime?: number;
};

/**
 * Returns handlers that prefetch the given query on hover/focus. Prefetches at
 * most once per mount to avoid thrashing the cache on mouse-move hovering.
 */
export const useHoverPrefetch = <T,>({ queryKey, queryFn, staleTime = 30_000 }: PrefetchOptions<T>) => {
  const queryClient = useQueryClient();
  const done = useRef(false);

  const prefetch = useCallback(() => {
    if (done.current) return;
    done.current = true;
    queryClient.prefetchQuery({ queryKey, queryFn, staleTime }).catch(() => {
      done.current = false; // allow retry if the fetch errored
    });
  }, [queryClient, queryKey, queryFn, staleTime]);

  return { onMouseEnter: prefetch, onFocus: prefetch };
};
