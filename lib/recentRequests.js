const STORAGE_KEY = 'ordr_recent_requests';

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
  } catch {
    // ignore
  }
}
