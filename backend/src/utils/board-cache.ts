// In-memory TTL cache for the public spectator board. The board payload is
// expensive to build (every draw + bracket recompute for the event) and is
// polled every 15s by each spectator, so a short TTL bounds the cost to one
// rebuild per event per TTL window regardless of audience size. Single-node
// deploy: a process-local Map is sufficient.
const TTL_MS = 10_000;

const cache = new Map<string, { payload: unknown; expiresAt: number }>();

export const BoardCache = {
  get(eventId: string): unknown | undefined {
    const hit = cache.get(eventId);
    if (!hit) return undefined;
    if (Date.now() >= hit.expiresAt) {
      cache.delete(eventId);
      return undefined;
    }
    return hit.payload;
  },

  set(eventId: string, payload: unknown): void {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now >= entry.expiresAt) cache.delete(key);
    }
    cache.set(eventId, { payload, expiresAt: now + TTL_MS });
  },

  invalidate(eventId: string): void {
    cache.delete(eventId);
  },
};
