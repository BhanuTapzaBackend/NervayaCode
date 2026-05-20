import { useState, useEffect, RefObject } from 'react';

interface UsePrivacyPolicyScrollProps {
  isMobile: boolean;
  scrollLockRef: RefObject<{ current: boolean }>;
  sectionIds: string[];
  defaultSection: string;
}

export interface ScrollLockRef {
  current: boolean;
}

export const usePrivacyPolicyScroll = ({
  isMobile,
  scrollLockRef,
  sectionIds,
  defaultSection,
}: UsePrivacyPolicyScrollProps) => {
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return '';
    }
    return defaultSection;
  });

  useEffect(() => {
    if (isMobile) {
      return;
    }

    const sections = [...sectionIds];

    let ticking = false;
    let lastActiveSection = sections[0];

    const handleScroll = () => {
      if (window.innerWidth <= 768) {
        return;
      }

      if (ticking || (scrollLockRef.current && scrollLockRef.current.current)) {
        return;
      }

      ticking = true;
      requestAnimationFrame(() => {
        if (scrollLockRef.current && scrollLockRef.current.current) {
          ticking = false;
          return;
        }

        const viewportTop = window.scrollY || document.documentElement.scrollTop;
        const viewportHeight = window.innerHeight;
        const triggerPoint = viewportTop + viewportHeight * 0.25;

        let currentActive = lastActiveSection;
        let bestScore = -Infinity;

        const isLastSection = (index: number) => index === sections.length - 1;

        sections.forEach((sectionId, index) => {
          const element = document.getElementById(sectionId);
          if (!element) {
            return;
          }

          const rect = element.getBoundingClientRect();
          const elementTop = viewportTop + rect.top;
          const elementBottom = elementTop + rect.height;

          const sectionHeader = element.querySelector('button') || element;
          const headerRect = sectionHeader.getBoundingClientRect();
          const headerTop = viewportTop + headerRect.top;

          const headerVisible = headerRect.top >= -100 && headerRect.top <= viewportHeight * 0.6;

          const visibleTop = Math.max(viewportTop, elementTop);
          const visibleBottom = Math.min(viewportTop + viewportHeight, elementBottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);

          const sectionHeight = elementBottom - elementTop;
          const visibilityRatio = sectionHeight > 0 ? visibleHeight / sectionHeight : 0;

          const documentHeight = document.documentElement.scrollHeight;
          const scrollBottom = viewportTop + viewportHeight;
          const isNearBottom = documentHeight - scrollBottom < 100;

          let score = 0;

          if (headerVisible) {
            const distanceFromTrigger = Math.abs(headerTop - triggerPoint);
            score = 2000 - distanceFromTrigger * 2;

            if (headerTop <= triggerPoint && headerTop >= triggerPoint - 150) {
              score += 1500;
            }
          }

          if (triggerPoint >= elementTop && triggerPoint < elementBottom) {
            score += 2000;
          }

          if (isLastSection(index) && isNearBottom) {
            if (rect.top <= viewportHeight && rect.bottom > viewportHeight * 0.3) {
              score += 3000;
            }
          }

          if (visibleHeight > 0) {
            score += visibilityRatio * 400;
          }

          if (rect.bottom < -50) {
            score -= 1000;
          }

          if (rect.top > viewportHeight + 50 && !isLastSection(index)) {
            score -= 1000;
          }

          if (score > bestScore) {
            bestScore = score;
            currentActive = sectionId;
          }
        });

        if (currentActive && currentActive !== lastActiveSection) {
          lastActiveSection = currentActive;
          setActiveSection(currentActive);
        }

        ticking = false;
      });
    };

    const initialCheck = setTimeout(() => {
      handleScroll();
    }, 200);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(initialCheck);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, scrollLockRef, sectionIds, defaultSection]);

  return { activeSection, setActiveSection };
};
