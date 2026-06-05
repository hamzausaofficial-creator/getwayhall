/** Resolve Django media URLs for <img src> in dev and prod. */
export function resolveMediaUrl(url) {
  if (!url) return '';

  if (url.startsWith('blob:')) return url;

  // DRF may return absolute backend URL — use path so Vite /media proxy works in dev
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const { pathname } = new URL(url);
      if (pathname.startsWith('/media/')) return pathname;
    } catch {
      /* keep original */
    }
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;

  if (import.meta.env.DEV) {
    return path;
  }

  const base = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
    : '';
  return `${base}${path}`;
}
