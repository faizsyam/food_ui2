const STORAGE_KEY = 'ordr_recent_requests';
const SCHEMA_CACHE_KEY = 'ordr_schema_cache';

export function getRecent() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRequest(text) {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecent();
    const updated = [text, ...current.filter((r) => r !== text)].slice(0, 3);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function removeRequest(text) {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecent();
    const updated = current.filter((r) => r !== text);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    removeCachedSchema(text);
  } catch {
    // ignore
  }
}

//
// Schema cache — stores the AI-generated schema for each request text
// so identical requests can be served instantly without hitting the AI again.
//

export function getCachedSchema(requestText) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SCHEMA_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    return cache[requestText] || null;
  } catch {
    return null;
  }
}

export function saveCachedSchema(requestText, schema) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SCHEMA_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[requestText] = schema;
    localStorage.setItem(SCHEMA_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export function removeCachedSchema(requestText) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SCHEMA_CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw);
    delete cache[requestText];
    localStorage.setItem(SCHEMA_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}
