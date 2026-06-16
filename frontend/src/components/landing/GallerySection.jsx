import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { PhotoGallery } from '../ui/gallery';
import { resolveMediaUrl } from '../../utils/media';
import { getGalleryStockImage } from '../../utils/galleryPlaceholders';

function resolveGallerySrc(img) {
  if (img?.image_url) {
    return resolveMediaUrl(img.image_url);
  }
  return getGalleryStockImage(img?.category || 'OTHER');
}

function gallerySrcKey(src) {
  if (!src) return '';
  try {
    const path = src.startsWith('http') ? new URL(src).pathname : src;
    return path.split('/').pop()?.toLowerCase() || src;
  } catch {
    return src;
  }
}

function LightboxImage({ item }) {
  const primarySrc = resolveGallerySrc(item);
  const [src, setSrc] = useState(primarySrc);

  useEffect(() => {
    setSrc(primarySrc);
  }, [primarySrc]);

  return (
    <motion.img
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.98, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="gallery-lightbox__image"
      src={src}
      alt={item.title}
      loading="eager"
      decoding="async"
      onError={() => {
        const fallback = getGalleryStockImage(item?.category || 'OTHER');
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}

export default function GallerySection({ images = [] }) {
  const [lightbox, setLightbox] = useState(null);

  const items = useMemo(() => {
    const seen = new Set();
    return (images || []).reduce((acc, img) => {
      const src = resolveGallerySrc(img);
      const key = gallerySrcKey(src);
      if (seen.has(key)) return acc;
      seen.add(key);
      acc.push(img);
      return acc;
    }, []);
  }, [images]);

  const galleryPhotos = useMemo(
    () => items.map((img, index) => ({
      id: img.id ?? index,
      src: resolveGallerySrc(img),
      fallbackSrc: getGalleryStockImage(img?.category || 'OTHER'),
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
    return (
      <section id="gallery" className="landing-section landing-section-white overflow-hidden">
        <div className="landing-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <ImageIcon size={40} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
          <p className="landing-text-muted" style={{ maxWidth: '28rem', margin: '0 auto' }}>
            No gallery photos yet. Upload images in Django Admin → Gallery images.
            On Railway, attach a volume at <code>/app/backend/media</code> or set{' '}
            <code>CLOUDINARY_URL</code> so uploads persist after deploy.
          </p>
        </div>
      </section>
    );
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
                <LightboxImage key={lightbox} item={lightboxItem} />
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
