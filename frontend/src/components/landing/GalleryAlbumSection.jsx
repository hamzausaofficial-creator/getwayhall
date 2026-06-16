import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImageTrail } from '../ui/image-trail';
import { resolveMediaUrl } from '../../utils/media';
import { getGalleryStockImage } from '../../utils/galleryPlaceholders';

const ALBUM_STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80',
];

function resolveAlbumSrc(img) {
  if (img?.image_url) return resolveMediaUrl(img.image_url);
  if (img?.src) return img.src;
  return getGalleryStockImage(img?.category || 'OTHER');
}

export default function GalleryAlbumSection({ images = [] }) {
  const containerRef = useRef(null);

  const albumImages = useMemo(() => {
    const fromGallery = (images || [])
      .map((img, index) => ({
        url: resolveAlbumSrc(img),
        alt: img.title || `Venue photo ${index + 1}`,
      }))
      .filter((item) => item.url);

    const merged = fromGallery.length >= 4
      ? fromGallery.map((item) => item.url)
      : [...fromGallery.map((item) => item.url), ...ALBUM_STOCK_IMAGES];

    const unique = [...new Set(merged)];
    return unique.slice(0, 10);
  }, [images]);

  const altLabels = useMemo(() => {
    const fromGallery = (images || []).map((img, index) => img.title || `Venue photo ${index + 1}`);
    while (fromGallery.length < albumImages.length) {
      fromGallery.push(`Album photo ${fromGallery.length + 1}`);
    }
    return fromGallery;
  }, [images, albumImages.length]);

  return (
    <section className="landing-gallery-album" aria-label="Interactive photo album">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45 }}
          className="landing-gallery-album__wrap"
        >
          <div ref={containerRef} className="landing-gallery-album__stage">
            <div className="landing-gallery-album__trail-host">
              <ImageTrail containerRef={containerRef} interval={90} rotationRange={18}>
                {albumImages.map((url, index) => (
                  <div
                    key={url}
                    className="landing-gallery-album__thumb"
                  >
                    <img
                      src={url}
                      alt={altLabels[index] || `Album photo ${index + 1}`}
                      className="landing-gallery-album__thumb-img"
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                ))}
              </ImageTrail>
            </div>

            <div className="landing-gallery-album__copy">
              <p className="landing-gallery-album__kicker">Interactive album</p>
              <h3 className="landing-gallery-album__title">
                Venue <span className="landing-gallery-album__title-accent">Album</span>
              </h3>
              <p className="landing-gallery-album__hint">
                Move your cursor across the canvas to paint the trail with venue moments.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
