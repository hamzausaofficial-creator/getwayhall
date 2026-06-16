import { useEffect } from 'react';
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import TrustSection from '../components/landing/TrustSection';
import GallerySection from '../components/landing/GallerySection';
import GalleryAlbumSection from '../components/landing/GalleryAlbumSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import WhyChooseSection from '../components/landing/WhyChooseSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import MapSection from '../components/landing/MapSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FAQSection from '../components/landing/FAQSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';
import LandingSkeleton from '../components/landing/LandingSkeleton';
import { useLandingContent } from '../hooks/useLandingContent';
import { useLandingLiveStats } from '../hooks/useLandingLiveStats';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  const { data, loading, error, reload } = useLandingContent();
  const { hero: heroStats, trust: trustStats, whyBadges } = useLandingLiveStats({
    hero: data.statistics?.hero,
    trust: data.statistics?.trust,
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-page', 'landing');
    return () => document.documentElement.removeAttribute('data-page');
  }, []);

  return (
    <div className="landing-root">
      <LandingNav transparent={false} />

      {loading ? (
        <LandingSkeleton />
      ) : (
        <>
          {error && (
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-lg">
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-900 flex-1">Using offline defaults. {error}</p>
              <button type="button" onClick={reload} className="p-2 rounded-lg hover:bg-amber-100" aria-label="Retry">
                <RefreshCw size={16} />
              </button>
            </div>
          )}

          <HeroSection
            slides={data.hero_slides}
            heroStats={heroStats}
          />
          <TrustSection stats={trustStats} />
          <GallerySection images={data.gallery} />
          <GalleryAlbumSection />
          <FeaturesSection />
          <WhyChooseSection badges={whyBadges} />
          <HowItWorksSection />
          <MapSection />
          <TestimonialsSection testimonials={data.testimonials} />
          <FAQSection faqs={data.faqs} />
          <CTASection />
          <LandingFooter />
        </>
      )}
    </div>
  );
}
