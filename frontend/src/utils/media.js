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
    // Dev only: proxy /media through Vite to Django
    if (import.meta.env.DEV) {
      try {
        const { pathname } = new URL(url);
        if (pathname.startsWith('/media/')) return pathname;
      } catch {
        /* keep original */
      }
    }
    // Production: keep full backend URL (Vercel + Railway split deploy)
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;

  if (import.meta.env.DEV) {
    return path;
  }

  const base = getMediaBaseUrl();
  return base ? `${base}${path}` : path;
}
