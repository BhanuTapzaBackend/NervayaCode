'use client';

import { TestimonialsCarousel, type TestimonialItem } from '@/components/common/TestimonialsCarousel';

interface TestimonialsProps {
  reviews?: TestimonialItem[];
}

const Testimonials = ({ reviews }: TestimonialsProps) => {
  if (!reviews || reviews.length === 0) return null;
  return <TestimonialsCarousel reviews={reviews} />;
};

export default Testimonials;
