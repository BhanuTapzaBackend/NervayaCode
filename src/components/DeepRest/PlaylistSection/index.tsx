'use client';

import { useSyncExternalStore, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';
import { ICON_PLAY, ICON_INFINITY } from '@/constants/icons';
import { DRIFT_OFF_PLAYLIST_VIDEOS } from '@/lib/constants/driftOff.constants';
import { trackPreviewPlay, trackAudioCompleted50, trackAudioCompleted100 } from '@/utils/analytics';
import styles from './styles.module.css';
import type { VideoPlayerProps } from '../VideoPlayer';

const VideoPlayerDynamic = dynamic(() => import('../VideoPlayer'), {
  ssr: false,
}) as React.ComponentType<VideoPlayerProps>;

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type VideoMilestone = 50 | 100;

const PlaylistSection = () => {
  const hasMounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const firedMilestonesRef = useRef<Map<number, Set<VideoMilestone>>>(new Map());

  const handleTimeUpdate = useCallback(
    (videoId: number, videoTitle: string, e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      if (!firedMilestonesRef.current.has(videoId)) {
        firedMilestonesRef.current.set(videoId, new Set());
      }
      const fired = firedMilestonesRef.current.get(videoId);
      if (!fired) return;
      if (pct >= 50 && !fired.has(50)) {
        fired.add(50);
        trackAudioCompleted50({ video_id: String(videoId), video_title: videoTitle });
      }
      if (pct >= 99 && !fired.has(100)) {
        fired.add(100);
        trackAudioCompleted100({ video_id: String(videoId), video_title: videoTitle });
      }
    },
    [],
  );

  return (
    <div className={styles.card}>
      <div className={styles.playlistHeader}>
        <div className={styles.accessBadge}>
          <Icon icon={ICON_INFINITY} width={16} height={16} /> Unlimited Lifetime Access
        </div>
      </div>

      <ul className={styles.playlistGrid} aria-label="Playlist videos">
        {DRIFT_OFF_PLAYLIST_VIDEOS.map((video) => (
          <li key={video.id} className={styles.videoCard}>
            <div className={styles.playlistVideoWrapper}>
              {hasMounted ? (
                <VideoPlayerDynamic
                  url={video.url}
                  width="100%"
                  height="100%"
                  playing={playingId === video.id}
                  controls
                  className={styles.playlistPlayerAbsolute}
                  onPlay={() => {
                    setPlayingId(video.id);
                    trackPreviewPlay({ video_id: String(video.id), video_title: video.title });
                  }}
                  onTimeUpdate={(e) => handleTimeUpdate(video.id, video.title, e)}
                  light={playingId !== video.id}
                  playIcon={
                    <div className={styles.supportIcon}>
                      <Icon icon={ICON_PLAY} width={16} height={16} />
                    </div>
                  }
                />
              ) : null}

              {playingId !== video.id && (
                <>
                  <div className={`${styles.videoDuration} ${styles.videoCardOverlay}`}>{video.duration}</div>
                  <div className={`${styles.videoCardContent} ${styles.videoCardOverlay}`}>
                    <h3 className={styles.videoTitle}>
                      {video.title} <span className={styles.videoTitleDot}>●</span>
                    </h3>
                    <p className={styles.videoCardAuthor}>
                      {video.author}
                      {video.isFree && <span className={styles.freeBadgeSmall}>Free</span>}
                    </p>
                  </div>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlaylistSection;
