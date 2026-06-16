"""Attach bundled AI gallery images when admin has not uploaded custom files."""
import os

from django.conf import settings
from django.core.files import File

GALLERY_SEED_FILES = {
    'MARRIAGE_HALL': 'marriage-hall.jpg',
    'WEDDING_STAGE': 'wedding-stage.jpg',
    'GUEST_ROOM': 'guest-room.jpg',
    'DINING': 'dining-area.jpg',
    'RECEPTION': 'reception-area.jpg',
    'OUTDOOR': 'outdoor-event.jpg',
    'OTHER': 'marriage-hall.jpg',
}

DEFAULT_GALLERY_URLS = {
    'MARRIAGE_HALL': '/gallery/marriage-hall.jpg',
    'WEDDING_STAGE': '/gallery/wedding-stage.jpg',
    'GUEST_ROOM': '/gallery/guest-room.jpg',
    'DINING': '/gallery/dining-area.jpg',
    'RECEPTION': '/gallery/reception-area.jpg',
    'OUTDOOR': '/gallery/outdoor-event.jpg',
    'OTHER': '/gallery/marriage-hall.jpg',
}


def get_gallery_seed_dir():
    candidates = [
        os.path.join(settings.BASE_DIR, 'landing', 'seed_assets', 'gallery'),
        os.path.normpath(os.path.join(settings.BASE_DIR, '..', 'frontend', 'public', 'gallery')),
        os.path.join(settings.BASE_DIR, 'media', 'seed', 'gallery'),
    ]
    for path in candidates:
        if os.path.isdir(path):
            return path
    return None


def default_gallery_image_url(category):
    return DEFAULT_GALLERY_URLS.get(category, DEFAULT_GALLERY_URLS['MARRIAGE_HALL'])


def gallery_item_needs_seed_image(image_field):
    if not image_field or not image_field.name:
        return True
    try:
        return not image_field.storage.exists(image_field.name)
    except Exception:
        return True


def attach_missing_gallery_images():
    from landing.models import GalleryImage

    seed_dir = get_gallery_seed_dir()
    if not seed_dir:
        return 0

    updated = 0
    for obj in GalleryImage.objects.all():
        if not gallery_item_needs_seed_image(obj.image):
            continue

        filename = GALLERY_SEED_FILES.get(obj.category, GALLERY_SEED_FILES['MARRIAGE_HALL'])
        filepath = os.path.join(seed_dir, filename)
        if not os.path.isfile(filepath):
            continue

        if obj.image:
            obj.image.delete(save=False)

        with open(filepath, 'rb') as handle:
            obj.image.save(filename, File(handle), save=True)
        updated += 1

    return updated
