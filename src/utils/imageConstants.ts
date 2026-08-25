export const IMAGES = {
  BACKGROUND_MAIN: 'https://res.cloudinary.com/disrq2eh8/image/upload/f_auto,q_auto/background_dediox.png',

  CARD_THERAPY_SESSION: 'https://res.cloudinary.com/disrq2eh8/image/upload/f_auto,q_auto/therapy_session_szvksr.png',
  CARD_DRIFT_OFF: 'https://res.cloudinary.com/disrq2eh8/image/upload/f_auto,q_auto/drift_off.png',
  // Single supplement card photo — used on the landing page cards AND the post-assessment
  // Recommendation cards. Swap this one file to change what the supplement shows app-wide.
  CARD_SLEEP_SUPPLEMENTS: '/card_sleep_supplements.png',

  AUTH_HERO_MORNING: '/assets/auth/morning-v2.png',
  AUTH_HERO_NIGHT: '/assets/auth/night-v1.png',

  AUTH_HERO_MORNING_MOBILE: '/assets/auth/morning-mobile.png',
  AUTH_HERO_NIGHT_MOBILE: '/assets/auth/night-mobile.png',

  ABOUT_US_MAIN: 'https://res.cloudinary.com/disrq2eh8/image/upload/f_auto,q_auto/about_us_main_ykusxn.png',

  API_ERROR: 'https://res.cloudinary.com/disrq2eh8/image/upload/f_auto,q_auto/api_errpr_fst50b.png',
  NO_DATA_FOUND: 'https://res.cloudinary.com/disrq2eh8/image/upload/f_auto,q_auto/no-data-concept_jobemv.png',

  HERO_MAIN: 'https://res.cloudinary.com/disrq2eh8/image/upload/f_auto,q_auto/v1771770997/welcome-hero_mygw11.png',
  NOT_FOUND_404: 'https://res.cloudinary.com/disrq2eh8/image/upload/f_auto,q_auto/v1773381422/404-bg_wz5p2l.png',

  // Product photo used in the post-assessment Recommendation cards.
  // The supplement card reuses CARD_SLEEP_SUPPLEMENTS so the landing page and the
  // recommendation cards always show the same photo.
  PRODUCT_DEEP_REST: '/card_deeprest.png',
} as const;
