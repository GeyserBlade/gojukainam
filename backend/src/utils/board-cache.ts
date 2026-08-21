// In-memory TTL cache for the public spectator board. The payloads are
// expensive to build (every draw + bracket recompute for the event) and are
// polled by every spectator at once, so a short TTL bounds the cost to one
// rebuild per key per TTL window regardless of audience size. Single-node
// deploy: a process-local Map is sufficient.
//
// Keys are namespaced per payload (`${eventId}:board`, `:athletes`,
// `:schedule`) because they go stale at very different rates: the live board
// changes with every captured result, while the day's schedule barely moves
// once the tournament starts.
const DEFAULT_TTL_MS = 10_000;

const cache = new Map<string, { payload: unknown; expiresAt: number }>();

export const BoardCache = {
  get(key: string): unknown | undefined {
    const hit = cache.get(key);
    if (!hit) return undefined;
    if (Date.now() >= hit.expiresAt) {
      cache.delete(key);
      return undefined;
    }
    return hit.payload;
  },

  set(key: string, payload: unknown, ttlMs: number = DEFAULT_TTL_MS): void {
    const now = Date.now();
    for (const [k, entry] of cache) {
      if (now >= entry.expiresAt) cache.delete(k);
    }
    cache.set(key, { payload, expiresAt: now + ttlMs });
  },

  invalidate(key: string): void {
    cache.delete(key);
  },
};
