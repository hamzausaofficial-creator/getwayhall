import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImageTrail } from '../ui/image-trail';
import { GALLERY_AI_IMAGE_LIST } from '../../constants/galleryImages';

const ALBUM_LABELS = [
  'Grand Marriage Hall',
  'Wedding Stage',
  'Guest Room',
  'Dining Area',
  'Reception Lounge',
  'Outdoor Event Lawn',
];

export default function GalleryAlbumSection() {
  const containerRef = useRef(null);
  const albumImages = useMemo(() => GALLERY_AI_IMAGE_LIST, []);

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
                      alt={ALBUM_LABELS[index] || `Marriage hall photo ${index + 1}`}
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
