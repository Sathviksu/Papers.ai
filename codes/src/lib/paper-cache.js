/**
 * Paper analysis result cache backed by localStorage.
 * Key: SHA-256-ish hash of paper title (first 200 chars) — avoids re-processing same paper.
 * Each entry: { summary, insights, knowledgeGraph, cachedAt }
 */

const PREFIX = 're_cache_v3_';

/** Simple deterministic hash for a string (no crypto dependency). */
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16);
}

/** Returns a stable cache key for a paper given its text content. */
export function paperCacheKey(text) {
  // Use first 300 chars as fingerprint — title + opening lines are unique per paper
  return PREFIX + hashString(text.slice(0, 300).trim());
}

/** Returns cached results for a paper, or null if not cached. */
export function getCachedPaper(text) {
  if (typeof window === 'undefined') return null;
  try {
    const key = paperCacheKey(text);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Invalidate entries older than 30 days
    const age = Date.now() - (parsed.cachedAt || 0);
    if (age > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Writes analysis results into localStorage for future reuse. */
export function setCachedPaper(text, { summary, insights, knowledgeGraph }) {
  if (typeof window === 'undefined') return;
  try {
    const key = paperCacheKey(text);
    localStorage.setItem(key, JSON.stringify({
      summary,
      insights,
      knowledgeGraph,
      cachedAt: Date.now(),
    }));
  } catch {
    // localStorage full — silently skip caching
  }
}

/** Remove a single cached paper result by its text fingerprint. */
export function removeCachedPaper(text) {
  if (typeof window === 'undefined') return;
  try {
    const key = paperCacheKey(text);
    localStorage.removeItem(key);
  } catch {
    // ignore localStorage failures
  }
}

/** Remove all cached paper entries (useful for a "clear cache" button). */
export function clearPaperCache() {
  if (typeof window === 'undefined') return;
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}
