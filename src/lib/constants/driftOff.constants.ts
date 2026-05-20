import { NTHERAPY_YOUTUBE_VIDEOS } from './enums';

export const DRIFT_OFF_SESSION_PRICE = 999;
export const DRIFT_OFF_SESSION_IMAGE = '/drift-off-session.png';

export const DRIFT_OFF_LANDING_VIDEO_URL = NTHERAPY_YOUTUBE_VIDEOS.LANDING_HERO;
export const DRIFT_OFF_HERO_VIDEO_URL = NTHERAPY_YOUTUBE_VIDEOS.HERO;

export const DRIFT_OFF_HERO_VIDEO_TITLE = 'Sample Guided Meditation';
export const DRIFT_OFF_HERO_VIDEO_AUTHOR = 'By Practia';
export const DRIFT_OFF_HERO_VIDEO_IS_FREE = true;

export const DRIFT_OFF_PLAYLIST_VIDEOS = [
  {
    id: 1,
    title: 'Sample Guided Meditation',
    duration: '25 min',
    author: 'By Practia',
    isFree: true,
    url: NTHERAPY_YOUTUBE_VIDEOS.POPULAR_1,
  },
  {
    id: 2,
    title: 'Evening Wind Down',
    duration: '20 min',
    author: 'By Dr. Sarah Mitchell',
    isFree: false,
    url: NTHERAPY_YOUTUBE_VIDEOS.POPULAR_2,
  },
] as const;
