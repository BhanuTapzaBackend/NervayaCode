import { ICON_CALENDAR, ICON_DASHBOARD, ICON_SETTINGS, ICON_STAR, ICON_USERS_GROUP } from '@/constants/icons';

export interface TherapistNavItem {
  label: string;
  path: string;
  icon: string;
  /** Shown in the mobile tab bar (max 4 + "More"). */
  mobile?: boolean;
}

/**
 * Therapist navigation.
 *
 * A flat list, not groups — the design has one ungrouped column.
 *
 * Deliberately ABSENT:
 *  - Earnings: therapists do not see financial data.
 *  - Messages: there is no messaging model in this codebase, and a nav item
 *    with a hardcoded unread badge is a lie the user sees on day one.
 *  - Sessions: the calendar already shows every session; a separate list was
 *    redundant.
 *  - /support and /account: both sit in CUSTOMER_ONLY_ROUTES, so middleware
 *    bounces therapists straight back to the dashboard. They were live dead
 *    links in the old sidebar.
 */
export const THERAPIST_NAV: readonly TherapistNavItem[] = [
  { label: 'Dashboard', path: '/therapist/dashboard', icon: ICON_DASHBOARD, mobile: true },
  { label: 'Calendar', path: '/therapist/calendar', icon: ICON_CALENDAR, mobile: true },
  { label: 'Clients', path: '/therapist/clients', icon: ICON_USERS_GROUP, mobile: true },
  { label: 'Availability', path: '/therapist/schedule', icon: ICON_CALENDAR },
  { label: 'Reviews', path: '/therapist/reviews', icon: ICON_STAR },
  { label: 'Settings', path: '/therapist/settings', icon: ICON_SETTINGS },
] as const;

export const THERAPIST_MOBILE_NAV = THERAPIST_NAV.filter((item) => item.mobile);
