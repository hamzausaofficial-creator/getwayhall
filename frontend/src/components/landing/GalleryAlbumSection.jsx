import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImageTrail } from '../ui/image-trail';

/** Decorative trail images — separate from the main gallery fan above. */
const ALBUM_TRAIL_IMAGES = [
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&q=80',
];

export default function GalleryAlbumSection() {
  const containerRef = useRef(null);
  const albumImages = useMemo(() => ALBUM_TRAIL_IMAGES, []);

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
                  <div key={url} className="landing-gallery-album__thumb">
                    <img
                      src={url}
                      alt={`Album trail ${index + 1}`}
                      className="landing-gallery-album__thumb-img"
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                ))}
              </ImageTrail>
            </div>

            <div className="landing-gallery-album__copy">
              <h3 className="landing-gallery-album__title landing-gallery-album__title--albums">
                ALBUMS
              </h3>
              <p className="landing-gallery-album__hint">
                Gateway Marriage Hall Album
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
