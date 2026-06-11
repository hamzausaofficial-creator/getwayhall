import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { PhotoGallery } from '../ui/gallery';
import { resolveMediaUrl } from '../../utils/media';
import { getGalleryStockImage, isGenericHeroImage } from '../../utils/galleryPlaceholders';

function resolveGallerySrc(img) {
  if (img.image_url && !isGenericHeroImage(img.image_url)) {
    return resolveMediaUrl(img.image_url);
  }
  return getGalleryStockImage(img.category);
}

export default function GallerySection({ images = [] }) {
  const [lightbox, setLightbox] = useState(null);
  const items = images.length ? images : [];

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

  if (!items.length) {
    return (
      <section id="gallery" className="landing-section landing-section-white overflow-hidden">
        <div className="landing-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <ImageIcon size={40} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
          <p className="landing-text-muted">Gallery images can be added from Django Admin</p>
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

      <AnimatePresence>
        {lightbox !== null && lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-3 sm:p-4"
            style={{ zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.97)', backdropFilter: 'blur(12px)' }}
            onClick={close}
          >
            <button
              type="button"
              className="absolute top-5 right-5 landing-text-white p-2 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onClick={close}
            >
              <X size={24} />
            </button>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 sm:left-4 landing-text-white p-2 sm:p-3 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  className="absolute right-2 sm:right-4 landing-text-white p-2 sm:p-3 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onClick={(e) => { e.stopPropagation(); next(); }}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <motion.img
              key={lightbox}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={resolveGallerySrc(lightboxItem)}
              alt={lightboxItem.title}
              style={{
                maxHeight: '85vh',
                maxWidth: '90vw',
                borderRadius: '1rem',
                objectFit: 'contain',
                boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-8" style={{ textAlign: 'center' }}>
              <p className="landing-kicker" style={{ marginBottom: '0.25rem' }}>
                {lightboxItem.category_label || lightboxItem.category}
              </p>
              <p className="landing-text-white font-bold text-xl">{lightboxItem.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
