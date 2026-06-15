import os


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
        return url
    if request:
        return request.build_absolute_uri(url)
    public_base = os.environ.get('PUBLIC_API_BASE_URL', '').rstrip('/')
    if public_base:
        path = url if url.startswith('/') else f'/{url}'
        return f'{public_base}{path}'
    return url
