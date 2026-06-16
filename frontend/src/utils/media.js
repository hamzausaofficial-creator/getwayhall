/** Resolve Django media URLs for <img src> in dev and prod. */
export function getMediaBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
  }
  return '';
}

export function resolveMediaUrl(url) {
  if (!url) return '';

  if (url.startsWith('blob:')) return url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/media/')) {
        if (import.meta.env.DEV) return parsed.pathname;
        const apiBase = getMediaBaseUrl();
        if (apiBase && parsed.host === new URL(apiBase).host) {
          return parsed.pathname;
        }
      }
    } catch {
      /* keep original */
    }
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;

  if (import.meta.env.DEV) {
    return path;
  }

  const base = getMediaBaseUrl();
  return base ? `${base}${path}` : path;
}
