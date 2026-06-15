import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoGallery } from '../ui/gallery';
import { resolveMediaUrl } from '../../utils/media';
import { getGalleryStockImage, isGenericHeroImage } from '../../utils/galleryPlaceholders';
import { getLandingDefaults } from '../../utils/landingDefaults';

function resolveGallerySrc(img) {
  if (img.image_url && !isGenericHeroImage(img.image_url)) {
    return resolveMediaUrl(img.image_url);
  }
  return getGalleryStockImage(img.category);
}

export default function GallerySection({ images = [] }) {
  const [lightbox, setLightbox] = useState(null);
  const items = images.length ? images : getLandingDefaults().gallery;

  const galleryPhotos = useMemo(
    () => items.map((img, index) => ({
      id: img.id ?? index,
      src: resolveGallerySrc(img),
      alt: img.title,
      title: img.title,
      category: img.category_label || img.category,
      index,
    })),
    [items],
  );

  useEffect(() => {
    if (lightbox === null) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox]);

  if (!items.length) {
    return null;
  }

  const close = () => setLightbox(null);
  const prev = () => setLightbox((i) => (i - 1 + items.length) % items.length);
  const next = () => setLightbox((i) => (i + 1) % items.length);
  const lightboxItem = lightbox !== null ? items[lightbox] : null;

  return (
    <section id="gallery" className="landing-section landing-section-white overflow-hidden">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <PhotoGallery
            photos={galleryPhotos}
            kicker="Showcase"
            title="Guest House & Hall"
            titleAccent="Gallery"
            subtitle="Marriage halls, wedding stages, guest rooms, dining, reception and outdoor spaces - drag photos to explore."
            onViewAll={() => setLightbox(0)}
            onPhotoClick={(index) => setLightbox(index)}
          />
        </motion.div>
      </div>

      {createPortal(
        <AnimatePresence>
          {lightbox !== null && lightboxItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="gallery-lightbox"
              onClick={close}
            >
              <button
                type="button"
                className="gallery-lightbox__close"
                aria-label="Close gallery"
                onClick={close}
              >
                <X size={24} />
              </button>
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-lightbox__nav gallery-lightbox__nav--prev"
                    aria-label="Previous image"
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    className="gallery-lightbox__nav gallery-lightbox__nav--next"
                    aria-label="Next image"
                    onClick={(e) => { e.stopPropagation(); next(); }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              <div className="gallery-lightbox__stage" onClick={(e) => e.stopPropagation()}>
                <div className="gallery-lightbox__image-frame">
                  <motion.img
                    key={lightbox}
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.98, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="gallery-lightbox__image"
                    src={resolveGallerySrc(lightboxItem)}
                    alt={lightboxItem.title}
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <div className="gallery-lightbox__caption">
                  <p className="gallery-lightbox__caption-kicker">
                    {lightboxItem.category_label || lightboxItem.category}
                  </p>
                  <p className="gallery-lightbox__caption-title">{lightboxItem.title}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}
