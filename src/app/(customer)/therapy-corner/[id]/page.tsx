'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar/LazySidebar';
import { GlobalLoader } from '@/components/common';

const BookingModal = dynamic(() => import('@/components/Booking/BookingModal'), { ssr: false });
import { therapistsApi } from '@/lib/api/therapists';
import StatusState from '@/components/common/StatusState';
import { Therapist } from '@/types/therapist.types';
import containerStyles from '@/app/(customer)/dashboard/styles.module.css';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/routesConstants';
import styles from './styles.module.css';
import { Icon } from '@iconify/react';
import { getEmbedUrl } from '@/lib/utils/video.utils';
import { ICON_QUOTES } from '@/constants/icons';
import { TestimonialsCarousel, type TestimonialItem } from '@/components/common/TestimonialsCarousel';
import { ImageCarousel } from '@/components/common/ImageCarousel';
import { TherapistAvatar } from '@/components/common/TherapistAvatar';
import { hasUsableImage } from '@/utils/therapistAvatar';
import { reviewsApi } from '@/lib/api/reviews';

export default function TherapistProfilePage() {
  const params = useParams<{ id: string }>();
  const therapistId = params?.id as string;

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openBooking, setOpenBooking] = useState(false);
  const [therapistReviews, setTherapistReviews] = useState<TestimonialItem[]>([]);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchTherapist = async () => {
      if (!therapistId) {
        setError('Invalid therapist id');
        setLoading(false);
        return;
      }

      try {
        const response = await therapistsApi.getById(therapistId);
        if (response.success && response.data) {
          setTherapist(response.data);

          reviewsApi
            .getByItemType('Therapy', therapistId, 1, 20)
            .then((res) => {
              if (res.success && res.data?.data) {
                setTherapistReviews(
                  res.data.data.map((r) => ({
                    name: r.userDisplayName || 'Anonymous',
                    rating: r.rating,
                    comment: r.comment || '',
                    initials: (r.userDisplayName || 'A').slice(0, 2).toUpperCase(),
                  })),
                );
              }
            })
            .catch(() => {});
        } else {
          setError('Therapist not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch therapist details');
      } finally {
        setLoading(false);
      }
    };

    void fetchTherapist();
  }, [therapistId]);

  const embedUrl = therapist?.introVideoUrl ? getEmbedUrl(therapist.introVideoUrl) : null;

  return (
    <Sidebar className={styles.pageContentWhite}>
      <div className={containerStyles.container} style={{ padding: 0, maxWidth: '100%', overflowX: 'hidden' }}>
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            background: 'var(--color-accent-surface)',
            minHeight: '100vh',
          }}
        >
          {loading && (
            <div className={styles.loadingWrap}>
              <GlobalLoader label="Loading therapist profile..." />
            </div>
          )}

          {!loading && error && (
            <StatusState
              type="error"
              title="Profile Not Found"
              message={
                error ||
                "We couldn't find the therapist profile you're looking for. It may have been moved or is no longer available."
              }
            />
          )}

          {!loading && !error && therapist && (
            <>
              {/* Top Section */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '60px',
                  padding: '60px 8%',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    flex: '1 1 300px',
                    maxWidth: '420px',
                    aspectRatio: '1/1',
                    borderRadius: '24px',
                    background:
                      'linear-gradient(135deg, var(--color-accent-surface) 0%, var(--color-accent-surface-hover) 100%)',
                    boxShadow: '0 20px 50px rgba(139, 92, 246, 0.15)',
                    overflow: 'hidden',
                    margin: '0 auto',
                  }}
                >
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={`${therapist.name} - Intro Video`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : therapist.introVideoUrl ? (
                    <video
                      controls
                      src={therapist.introVideoUrl}
                      poster={therapist.introVideoThumbnail || therapist.image || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    >
                      <source src={therapist.introVideoUrl} />
                      Your browser does not support the video tag.
                    </video>
                  ) : hasUsableImage(therapist.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={therapist.image}
                      alt={therapist.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <TherapistAvatar gender={therapist.gender} name={therapist.name} />
                  )}
                </div>

                <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h1 style={{ margin: 0, color: 'var(--color-accent)', fontSize: '2.2rem', fontWeight: 500 }}>
                    {therapist.name}&apos;s Bio
                  </h1>

                  <div
                    style={{
                      color: 'var(--color-text-slate-400)',
                      fontSize: '1.05rem',
                      lineHeight: '1.8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                    }}
                  >
                    {therapist.bioLong ? (
                      <p style={{ margin: 0 }}>{therapist.bioLong}</p>
                    ) : therapist.bio ? (
                      <p style={{ margin: 0 }}>{therapist.bio}</p>
                    ) : (
                      <>
                        <p style={{ margin: 0 }}>
                          Trouble unwinding at night? Our expert therapists gently help you release anxiety &amp;
                          stress, restore your natural sleep rhythm, and wake up feeling lighter and more refreshed at
                          day.
                        </p>
                        <p style={{ margin: 0 }}>
                          Our compassionate approach combines evidence-based techniques with personalized care to
                          support your mental wellness journey.
                        </p>
                      </>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: '12px',
                      paddingLeft: '18px',
                      borderLeft: '4px solid var(--color-accent-secondary)',
                      color: 'var(--color-accent)',
                      fontStyle: 'italic',
                      fontSize: '1.15rem',
                      fontWeight: 500,
                      lineHeight: '1.6',
                    }}
                  >
                    &quot;
                    {therapist.quote || 'Healing is not a destination, but a journey of self-discovery and growth.'}
                    &quot;
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(pathname)}`);
                          return;
                        }
                        setOpenBooking(true);
                      }}
                      style={{
                        padding: '12px 28px',
                        background: 'var(--color-accent)',
                        color: 'var(--color-background)',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(var(--color-accent-rgb), 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              </div>

              {therapist.galleryImages && therapist.galleryImages.length > 0 && (
                <div
                  style={{
                    padding: '40px 8%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '32px',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: 'var(--color-accent)',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    Gallery
                  </h2>
                  <div style={{ width: '100%', maxWidth: '640px' }}>
                    <ImageCarousel
                      images={therapist.galleryImages}
                      alt={`${therapist.name} gallery image`}
                      autoScroll
                    />
                  </div>
                </div>
              )}

              {/* Middle Section - Message to You */}
              <div
                style={{
                  position: 'relative',
                  background: 'var(--color-accent-surface)',
                  padding: '80px 8%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '24px',
                  overflow: 'hidden',
                  borderTop: '1px solid rgba(168, 85, 247, 0.2)',
                  borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <Icon
                    icon={ICON_QUOTES}
                    style={{ color: 'var(--color-accent-secondary)', fontSize: '3.5rem', marginBottom: '-10px' }}
                  />

                  <h2 style={{ margin: 0, color: 'var(--color-accent)', fontSize: '1.25rem', fontWeight: 600 }}>
                    Message to You
                  </h2>
                </div>

                <p
                  style={{
                    margin: 0,
                    maxWidth: '850px',
                    color: 'var(--color-accent-hover)',
                    fontSize: '1.15rem',
                    lineHeight: '1.9',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {therapist.messageToClient ||
                    "Trouble unwinding at night? Our expert therapists gently help you release anxiety & stress, restore your natural sleep rhythm, and wake up feeling lighter and more refreshed at day. You deserve peace of mind and restful nights. Let's work together to help you rediscover the calm and balance you've been seeking."}
                </p>

                <Icon
                  icon={ICON_QUOTES}
                  style={{
                    position: 'absolute',
                    right: '10%',
                    bottom: '30px',
                    color: 'var(--color-accent-light)',
                    fontSize: '8rem',
                    opacity: 0.4,
                    transform: 'scaleX(-1)',
                    zIndex: 1,
                  }}
                />
              </div>

              {/* Bottom Section - Testimonials */}
              <div className={styles.testimonialsCarouselWrap}>
                <TestimonialsCarousel
                  reviews={(() => {
                    const existingTestimonials: TestimonialItem[] = (therapist.testimonials || []).map((t) => ({
                      name: t.name,
                      rating: 5,
                      comment: t.message,
                      initials: t.name.slice(0, 2).toUpperCase(),
                    }));
                    return [...therapistReviews, ...existingTestimonials];
                  })()}
                  title="Testimonials"
                  autoScroll
                />
              </div>
            </>
          )}
        </section>
      </div>

      {openBooking && therapist && (
        <BookingModal
          therapistId={therapist._id}
          therapistName={therapist.name}
          onClose={() => setOpenBooking(false)}
          onSuccess={() => {}}
        />
      )}
    </Sidebar>
  );
}
