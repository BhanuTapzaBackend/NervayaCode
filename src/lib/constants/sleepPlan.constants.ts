export const SLEEP_BUNDLE_DISCOUNT_KEY = 'sleep_bundle_discount_percentage';
export const THERAPY_STARTING_PRICE_KEY = 'therapy_starting_price';
export const DEEP_REST_RECOMMENDATION_PRICE_KEY = 'deep_rest_recommendation_price';
export const SUPPLEMENT_RECOMMENDATION_PRICE_KEY = 'supplement_recommendation_price';

export const SLEEP_BUNDLE_DISCOUNT_DEFAULT = 18;
export const THERAPY_STARTING_PRICE_DEFAULT = 1599;
export const DEEP_REST_RECOMMENDATION_PRICE_DEFAULT = 2499;
export const SUPPLEMENT_RECOMMENDATION_PRICE_DEFAULT = 1299;

export const SLEEP_PLAN_BUNDLE_SOURCE = 'sleep-plan-bundle';

export const SLEEP_BUNDLE_DISCOUNT_MAX = 60;
export const SLEEP_BUNDLE_DISCOUNT_MIN = 0;

// Governs the STANDALONE therapy CTAs only: false sends them to /therapy-corner
// and labels them "Choose a Therapist".
//
// It no longer has anything to do with the plan's therapist popup. That popup is
// now bundle-only and always opens for a plan containing therapy, because the
// slot must be held before the plan's single payment. Flipping this back to
// `true` will NOT restore the old recommend-one-therapist flow — that was
// removed in favour of picking from the full list inside the popup.
export const THERAPIST_RECOMMENDATION_MODAL_ENABLED = false;
export const THERAPY_CORNER_PATH = '/therapy-corner';
