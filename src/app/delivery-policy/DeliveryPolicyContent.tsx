'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PrivacyPolicyHeader from '@/components/PrivacyPolicy/PrivacyPolicyHeader';
import PrivacyPolicyTOC from '@/components/PrivacyPolicy/PrivacyPolicyTOC';
import PrivacyPolicySection from '@/components/PrivacyPolicy/PrivacyPolicySection';
import SectionContent from '@/components/PrivacyPolicy/PrivacyPolicySections/SectionContent';
import PrivacyPolicyDisclaimer from '@/components/PrivacyPolicy/PrivacyPolicyDisclaimer';
import { deliverySections, tocItems } from '@/utils/deliveryPolicyData';
import { PrivacySection } from '@/utils/privacyPolicyData';
import { DELIVERY_POLICY_SECTIONS, DEFAULT_DELIVERY_POLICY_SECTION } from '@/utils/deliveryPolicyConstants';
import { usePrivacyPolicyScroll } from '@/hooks/usePrivacyPolicyScroll';
import styles from '../privacy-policy/privacy-policy.module.css';

const DeliveryPolicyContent = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['shipping-partners']));
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });
  const scrollLockRef = useRef<{ current: boolean }>({ current: false });

  const { activeSection, setActiveSection } = usePrivacyPolicyScroll({
    isMobile,
    scrollLockRef,
    sectionIds: DELIVERY_POLICY_SECTIONS as unknown as string[],
    defaultSection: DEFAULT_DELIVERY_POLICY_SECTION,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSectionActive = useCallback(
    (sectionId: string) => {
      if (isMobile) {
        return openSections.has(sectionId);
      }
      return activeSection === sectionId;
    },
    [isMobile, openSections, activeSection],
  );

  const toggleSection = useCallback(
    (sectionId: string) => {
      setOpenSections((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(sectionId)) {
          newSet.delete(sectionId);
          if (isMobile) {
            setActiveSection('');
          }
        } else {
          newSet.add(sectionId);
          if (isMobile) {
            setActiveSection(sectionId);
          }
        }
        return newSet;
      });
      if (!isMobile) {
        setActiveSection(sectionId);
      }
    },
    [isMobile, setActiveSection],
  );

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const element = document.getElementById(sectionId);
      if (element) {
        scrollLockRef.current.current = true;
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (!openSections.has(sectionId)) {
          toggleSection(sectionId);
        } else {
          setActiveSection(sectionId);
        }
        setTimeout(() => {
          scrollLockRef.current.current = false;
        }, 1000);
      }
    },
    [openSections, toggleSection, setActiveSection],
  );

  const sectionToggleHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {};
    deliverySections.forEach((section) => {
      handlers[section.id] = () => toggleSection(section.id);
    });
    return handlers;
  }, [toggleSection]);

  const sectionsWithState = useMemo(() => {
    return deliverySections.map((section) => ({
      ...section,
      isOpen: openSections.has(section.id),
    }));
  }, [openSections]);

  return (
    <div className={styles.container}>
      <PrivacyPolicyHeader
        title="Delivery & Shipping Policy"
        subtitle="NERVAYA – Delivery & Shipping Policy for physical supplement products."
      />

      <div className={styles.mainContent}>
        <PrivacyPolicyTOC
          items={tocItems}
          activeSection={activeSection}
          isSectionActive={isSectionActive}
          scrollToSection={scrollToSection}
        />

        <div className={styles.contentSections}>
          {sectionsWithState.map((section) => (
            <PrivacyPolicySection
              key={section.id}
              section={section as unknown as PrivacySection}
              isOpen={section.isOpen}
              onToggle={sectionToggleHandlers[section.id]}
            >
              <SectionContent content={section.content} />
            </PrivacyPolicySection>
          ))}

          <PrivacyPolicyDisclaimer />
        </div>
      </div>
    </div>
  );
};

export default DeliveryPolicyContent;
