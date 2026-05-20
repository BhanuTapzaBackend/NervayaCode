import { ICON_SHIELD_CHECK, ICON_SHIELD_WARNING, ICON_LIGHTBULB, ICON_INFO } from '@/constants/icons';
import type { SleepAssessmentSeverityBand, SeverityBannerEntry } from '@/types/sleepAssessment.types';

export const SEVERITY_BANNER_MAP: Record<SleepAssessmentSeverityBand, SeverityBannerEntry> = {
  severe: {
    icon: ICON_SHIELD_WARNING,
    themeClass: 'bannerSevere',
    headline: 'Severe deviations from natural sleep cycle detected',
    fallbackText:
      '**Better sleep is within reach**: Your sleep patterns indicate significant disruption that may be affecting energy, mood, and recovery. Your personalized recommendations focus on high-impact changes first to help restore stability and improve sleep quality progressively.',
  },
  moderate: {
    icon: ICON_LIGHTBULB,
    themeClass: 'bannerModerate',
    headline: 'Moderate deviations from natural sleep cycle detected',
    fallbackText:
      '**Sleep may benefit from structured improvements**: Some recurring patterns are impacting your sleep consistency and recovery. Your personalized plan prioritizes targeted adjustments that can create noticeable improvements over time.',
  },
  mild: {
    icon: ICON_INFO,
    themeClass: 'bannerMild',
    headline: 'Mild deviations from natural sleep cycle detected',
    fallbackText:
      '**Consistent, restorative sleep may be closer than expected**: A few mild disruptions were detected that may occasionally affect sleep quality or consistency. Your recommendations focus on small but effective optimizations to strengthen your overall sleep routine.',
  },
  none: {
    icon: ICON_SHIELD_CHECK,
    themeClass: 'bannerNone',
    headline: 'No significant deviations from natural sleep cycle detected',
    fallbackText:
      '**Your sleep appears to be in a healthy range**: No major disruptions were identified in your recent assessment. Your personalized insights focus on maintaining consistency and supporting long-term sleep wellness.',
  },
};
