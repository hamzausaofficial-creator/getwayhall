/** Default AI gallery images — admin uploads in Django override these via API. */
export const GALLERY_AI_IMAGES = {
  MARRIAGE_HALL: '/gallery/marriage-hall.jpg',
  WEDDING_STAGE: '/gallery/wedding-stage.jpg',
  GUEST_ROOM: '/gallery/guest-room.jpg',
  DINING: '/gallery/dining-area.jpg',
  RECEPTION: '/gallery/reception-area.jpg',
  OUTDOOR: '/gallery/outdoor-event.jpg',
  OTHER: '/gallery/marriage-hall.jpg',
};

export const GALLERY_AI_IMAGE_LIST = [
  GALLERY_AI_IMAGES.MARRIAGE_HALL,
  GALLERY_AI_IMAGES.WEDDING_STAGE,
  GALLERY_AI_IMAGES.GUEST_ROOM,
  GALLERY_AI_IMAGES.DINING,
  GALLERY_AI_IMAGES.RECEPTION,
  GALLERY_AI_IMAGES.OUTDOOR,
];

export function getGalleryAiImage(category) {
  return GALLERY_AI_IMAGES[category] || GALLERY_AI_IMAGES.OTHER;
}
