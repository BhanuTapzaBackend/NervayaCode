'use client';

import { useState, useSyncExternalStore, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';
import { ICON_PLAY, ICON_EYE, ICON_ARROW_RIGHT } from '@/constants/icons';
import { DRIFT_OFF_LANDING_VIDEO_URL, DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { cartApi } from '@/lib/api/cart';
import { ROUTES } from '@/utils/routesConstants';
import { toast } from 'sonner';
import Button from '@/components/common/Button';
import type { VideoPlayerProps } from '../VideoPlayer';
import styles from './styles.module.css';

const VideoPlayerDynamic = dynamic(() => import('../VideoPlayer'), {
  ssr: false,
}) as React.ComponentType<VideoPlayerProps>;

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const DriftOffLandingHero = () => {
  const hasMounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const { isAuthenticated, initializing } = useAuth();
  const { refreshCart } = useCart();
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [sessionPrice, setSessionPrice] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/deep-rest/plan')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && typeof res.data?.price === 'number') {
          setSessionPrice(res.data.price);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddToCart = async () => {
    if (initializing) return;
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(ROUTES.DEEP_REST)}`);
      return;
    }

    setIsAdding(true);
    try {
      if (sessionPrice === null) {
        toast.error('Could not load session price. Please try again.');
        return;
      }
      const response = await cartApi.add(
        'drift-off-session',
        1,
        'DriftOff',
        'Deep Rest Session',
        sessionPrice,
        DRIFT_OFF_SESSION_IMAGE,
      );
      if (response.success) {
        refreshCart();
        toast.success('Added to cart!');
      } else {
        toast.error(`Failed to add to cart: ${response.message}`);
      }
    } catch (_err) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section className={styles.hero} aria-label="Deep Rest hero">
      <div className={styles.heroLeft}>
        <p className={styles.description}>
          No more endless browsing for the right guided sleep sessions. You are as unique as your needs and our
          specialists will curate a 25 min Deep Rest Session for you targeting your special mental needs.
        </p>
        <div className={styles.actions}>
          <Button href="/deep-rest/payment" variant="primary" size="lg" fullWidth={false} className={styles.ctaPrimary}>
            Buy Tailored Audio
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth={false}
            onClick={handleAddToCart}
            disabled={isAdding}
            loading={isAdding}
            className={styles.ctaSecondary}
          >
            Add to Cart
          </Button>
        </div>
        <Link href="/deep-rest/about" className={styles.tertiaryLink}>
          What are Deep Rest sessions?
          <Icon icon={ICON_ARROW_RIGHT} aria-hidden className={styles.tertiaryIcon} />
        </Link>
      </div>

      <div className={styles.heroRight}>
        <div className={styles.videoCard}>
          <div className={styles.videoWrapper}>
            {hasMounted && (
              <VideoPlayerDynamic
                url={DRIFT_OFF_LANDING_VIDEO_URL}
                width="100%"
                height="100%"
                playing={playing}
                controls
                className={styles.playerAbsolute}
                onPlay={() => setPlaying(true)}
              />
            )}
            {!playing && (
              <button
                type="button"
                className={styles.playButton}
                onClick={() => setPlaying(true)}
                aria-label="Play sample video"
              >
                <Icon icon={ICON_PLAY} width={18} height={18} aria-hidden />
              </button>
            )}
          </div>
          <div className={styles.videoMeta}>
            <div className={styles.videoMetaText}>
              <span className={styles.videoTitle}>
                Sample Guided Meditation <span className={styles.dot}>●</span>
              </span>
              <span className={styles.videoAuthor}>By Practia</span>
            </div>
            <Link href="/deep-rest/sessions" className={styles.viewSessionsLink} aria-label="View my sessions">
              <Icon icon={ICON_EYE} width={16} height={16} aria-hidden className={styles.viewSessionsIcon} />
              View My Sessions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DriftOffLandingHero;
