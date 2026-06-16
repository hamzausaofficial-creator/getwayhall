import {
  Building2, Sparkles, BedDouble, UtensilsCrossed, DoorOpen, Trees,
} from 'lucide-react';
import { getGalleryAiImage } from '../constants/galleryImages';

/** Premium placeholders when no custom admin upload is available. */
export const GALLERY_PLACEHOLDERS = {
  MARRIAGE_HALL: {
    gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 45%, #5bd51e33 100%)',
    icon: Building2,
    pattern: 'Marriage Hall',
    stockImage: getGalleryAiImage('MARRIAGE_HALL'),
  },
  WEDDING_STAGE: {
    gradient: 'linear-gradient(135deg, #451a03 0%, #7c2d12 50%, #f59e0b44 100%)',
    icon: Sparkles,
    pattern: 'Wedding Stage',
    stockImage: getGalleryAiImage('WEDDING_STAGE'),
  },
  GUEST_ROOM: {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #38bdf833 100%)',
    icon: BedDouble,
    pattern: 'Guest Room',
    stockImage: getGalleryAiImage('GUEST_ROOM'),
  },
  DINING: {
    gradient: 'linear-gradient(135deg, #292524 0%, #57534e 50%, #d9770644 100%)',
    icon: UtensilsCrossed,
    pattern: 'Dining',
    stockImage: getGalleryAiImage('DINING'),
  },
  RECEPTION: {
    gradient: 'linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #a78bfa33 100%)',
    icon: DoorOpen,
    pattern: 'Reception',
    stockImage: getGalleryAiImage('RECEPTION'),
  },
  OUTDOOR: {
    gradient: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #5bd51e44 100%)',
    icon: Trees,
    pattern: 'Outdoor',
    stockImage: getGalleryAiImage('OUTDOOR'),
  },
  OTHER: {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #5bd51e22 100%)',
    icon: Building2,
    pattern: 'Venue',
    stockImage: getGalleryAiImage('OTHER'),
  },
};

/** Stock photos for hero marquee — kept separate from gallery AI images. */
export const HERO_MARQUEE_STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&q=80&auto=format&fit=crop',
];

export function isGenericHeroImage(url) {
  if (!url) return true;
  const u = String(url).toLowerCase();
  return u.includes('hero.png') || u.endsWith('/hero.png');
}

export function getGalleryPlaceholder(category) {
  return GALLERY_PLACEHOLDERS[category] || GALLERY_PLACEHOLDERS.OTHER;
}

export function getGalleryStockImage(category) {
  return getGalleryPlaceholder(category).stockImage;
}
