'use client';

import { useSyncExternalStore, useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';
import { ICON_PLAY } from '@/constants/icons';
import {
  DRIFT_OFF_HERO_VIDEO_AUTHOR,
  DRIFT_OFF_HERO_VIDEO_IS_FREE,
  DRIFT_OFF_HERO_VIDEO_TITLE,
  DRIFT_OFF_HERO_VIDEO_URL,
} from '@/lib/constants/driftOff.constants';
import styles from './styles.module.css';
import { VideoPlayerProps } from '../VideoPlayer';

const VideoPlayerDynamic = dynamic(() => import('../VideoPlayer'), {
  ssr: false,
}) as React.ComponentType<VideoPlayerProps>;

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const DriftOffHero = () => {
  const hasMounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [playing, setPlaying] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.heroVideoCard}>
        <div className={styles.heroVideoWrapper}>
          {hasMounted && (
            <VideoPlayerDynamic
              url={DRIFT_OFF_HERO_VIDEO_URL}
              width="100%"
              height="100%"
              playing={playing}
              controls
              className={styles.heroPlayerAbsolute}
              onPlay={() => setPlaying(true)}
            />
          )}

          {!playing && (
            <>
              <div className={styles.heroVideoOverlay}>
                <h3 className={styles.heroVideoOverlayTitle}>
                  {DRIFT_OFF_HERO_VIDEO_TITLE} <span className={styles.videoTitleDot}>●</span>
                </h3>
                <p className={styles.heroVideoOverlayAuthor}>
                  {DRIFT_OFF_HERO_VIDEO_AUTHOR}{' '}
                  {DRIFT_OFF_HERO_VIDEO_IS_FREE && <span className={styles.freeBadge}>Free</span>}
                </p>
              </div>
              <button
                type="button"
                className={styles.heroPlayButton}
                onClick={() => setPlaying(true)}
                aria-label="Play video"
              >
                <Icon icon={ICON_PLAY} width={20} height={20} className={styles.heroPlayButtonIcon} aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriftOffHero;
