import os


def _ensure_https(url):
    if url.startswith('http://') and (
        os.environ.get('RAILWAY_ENVIRONMENT')
        or os.environ.get('PUBLIC_API_BASE_URL')
        or os.environ.get('RAILWAY_PUBLIC_DOMAIN')
    ):
        return 'https://' + url[len('http://'):]
    return url


def get_media_file_url(request, file_field):
    """Return an absolute URL for uploaded files (local /media or Cloudinary)."""
    if not file_field:
        return None
    try:
        url = file_field.url
    except Exception:
        return None
    if not url:
        return None
    if url.startswith('http://') or url.startswith('https://'):
        return _ensure_https(url)
    if request:
        return _ensure_https(request.build_absolute_uri(url))
    public_base = os.environ.get('PUBLIC_API_BASE_URL', '').rstrip('/')
    if not public_base:
        from django.conf import settings
        public_base = getattr(settings, 'PUBLIC_API_BASE_URL', '') or ''
    if public_base:
        path = url if url.startswith('/') else f'/{url}'
        return f'{public_base.rstrip("/")}{path}'
    return url
