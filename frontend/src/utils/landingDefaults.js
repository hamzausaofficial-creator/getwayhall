/** Client-side fallback when landing API is unreachable. */
import { GALLERY_AI_IMAGES } from '../constants/galleryImages';

export function getLandingDefaults() {
  return {
    hero_slides: [{
      id: 0,
      title: 'Manage Marriage Halls & Guest Houses With Ease',
      subtitle: 'Complete venue management solution for bookings, guests, events, finances and operations.',
      background_image_url: null,
      button_text: 'Get Started',
      button_link: '/login',
      sort_order: 0,
    }],
    gallery: [
      { id: 0, title: 'Grand Marriage Hall', category: 'MARRIAGE_HALL', category_label: 'Marriage Hall', image_url: GALLERY_AI_IMAGES.MARRIAGE_HALL, sort_order: 0 },
      { id: 1, title: 'Royal Wedding Stage', category: 'WEDDING_STAGE', category_label: 'Wedding Stage', image_url: GALLERY_AI_IMAGES.WEDDING_STAGE, sort_order: 1 },
      { id: 2, title: 'Deluxe Guest Room', category: 'GUEST_ROOM', category_label: 'Guest Room', image_url: GALLERY_AI_IMAGES.GUEST_ROOM, sort_order: 2 },
      { id: 3, title: 'Fine Dining Area', category: 'DINING', category_label: 'Dining Area', image_url: GALLERY_AI_IMAGES.DINING, sort_order: 3 },
      { id: 4, title: 'Elegant Reception', category: 'RECEPTION', category_label: 'Reception Area', image_url: GALLERY_AI_IMAGES.RECEPTION, sort_order: 4 },
      { id: 5, title: 'Outdoor Event Lawn', category: 'OUTDOOR', category_label: 'Outdoor Event Area', image_url: GALLERY_AI_IMAGES.OUTDOOR, sort_order: 5 },
    ],
    testimonials: [
      {
        id: 0,
        customer_name: 'Jahanzeb Mumtaz',
        customer_photo_url: null,
        designation: 'Owner, Morning Star Hall',
        review: 'Gateway Marriage Hall has completely transformed how we handle wedding season. We have seen a 30% increase in revenue by automating follow-ups.',
        rating: 5,
        sort_order: 0,
      },
      {
        id: 1,
        customer_name: 'Fatima Sheikh',
        customer_photo_url: null,
        designation: 'Manager, Royal Guest House',
        review: 'Guest house check-ins, payments, and room availability - everything is in one place. Our staff learned it in a single day.',
        rating: 5,
        sort_order: 1,
      },
      {
        id: 2,
        customer_name: 'Ahmed Raza',
        customer_photo_url: null,
        designation: 'Director, Al-Noor Event Complex',
        review: 'From hall bookings to expense vouchers, this system replaced five different notebooks. Reports alone save us hours every week.',
        rating: 5,
        sort_order: 2,
      },
    ],
    statistics: {
      hero: [
        { id: 1, label: 'Total Events', value_display: '12k+', value_number: 12000, suffix: '+' },
        { id: 2, label: 'Venues Managed', value_display: '200+', value_number: 200, suffix: '+' },
        { id: 3, label: 'Guest House Stays', value_display: '8,000+', value_number: 8000, suffix: '+' },
        { id: 4, label: 'Satisfaction Rate', value_display: '98%', value_number: 98, suffix: '%' },
      ],
      trust: [
        { id: 5, label: 'Years of Experience', value_display: '15+', value_number: 15, suffix: '+' },
        { id: 6, label: 'Average Rating', value_display: '4.9', value_number: 49, suffix: '/5' },
        { id: 7, label: 'Active Venues', value_display: '200+', value_number: 200, suffix: '+' },
        { id: 8, label: 'Expert Support', value_display: '24/7', value_number: null, suffix: '' },
      ],
    },
    faqs: [
      { id: 1, question: 'Can I migrate my existing data?', answer: 'Yes. Import bookings, customers, and financial records from Excel with our onboarding support.' },
      { id: 2, question: 'Does it support Marriage Hall and Guest House?', answer: 'Yes. Manage both venue types from one platform with dedicated modules.' },
      { id: 3, question: 'How secure is my customer data?', answer: 'Role-based access, encrypted storage, and audit trails keep your data safe.' },
      { id: 4, question: 'Is training required for staff?', answer: 'No lengthy training needed. The interface is designed for venue staff and most teams are productive within a day.' },
      { id: 5, question: 'Can I manage multiple halls from one account?', answer: 'Yes. Add multiple halls, guest houses, and staff with role-based permissions from a single dashboard.' },
      { id: 6, question: 'Do you offer customer support?', answer: 'Yes. Our team provides onboarding help, data migration assistance, and ongoing support for your venue operations.' },
    ],
  };
}
