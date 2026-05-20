'use client';

import { useEffect, useState } from 'react';
import { deepRestApi } from '@/lib/api/deepRest';
import { getInitials } from '@/utils/string.util';
import Testimonials from './index';
import type { TestimonialItem } from '@/components/common/TestimonialsCarousel';

interface TestimonialsWithDataProps {
  sectionClassName?: string;
  titleClassName?: string;
}

export default function TestimonialsWithData({ sectionClassName, titleClassName }: TestimonialsWithDataProps) {
  const [reviews, setReviews] = useState<TestimonialItem[]>([]);

  useEffect(() => {
    deepRestApi
      .getApprovedReviews(1, 30)
      .then((res) => {
        if (res.success && res.data?.data && res.data.data.length > 0) {
          const mapped: TestimonialItem[] = res.data.data.map((r) => ({
            id: r._id,
            name: r.userDisplayName || 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
            initials: getInitials(r.userDisplayName || 'A'),
          }));
          setReviews(mapped);
        }
      })
      .catch(() => undefined);
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className={sectionClassName} aria-labelledby="testimonials-heading">
      <h2 id="testimonials-heading" className={titleClassName}>
        Testimonials
      </h2>
      <Testimonials reviews={reviews} />
    </section>
  );
}
