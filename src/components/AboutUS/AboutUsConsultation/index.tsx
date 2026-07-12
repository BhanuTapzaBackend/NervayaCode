'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import styles from './styles.module.css';
import { Icon } from '@iconify/react';
import { ICON_CHAT, ICON_USER, ICON_MAIL, ICON_CALENDAR, ICON_VIDEO, ICON_PHONE, ICON_CLOCK } from '@/constants/icons';
import { Button, Input, Dropdown } from '@/components/common';
import DatePicker from '@/components/Booking/DatePicker';
import TimeSlotGrid from '@/components/Booking/TimeSlotGrid';
import { trackLeadSubmitted } from '@/utils/analytics';
import axios from 'axios';
import { TherapistSlot } from '@/types/session.types';
import type { PublicSlot } from '@/types/consultation.types';
import { useZohoLead } from '@/hooks/useZohoLead';

interface AboutUsConsultationProps {
  centerCard?: boolean;
}

const AboutUsConsultation = ({ centerCard = false }: AboutUsConsultationProps) => {
  const pathname = usePathname();
  const { pushLead } = useZohoLead();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    connectionType: 'Video Call',
    email: '',
    mobile: '',
    date: new Date(),
    time: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [slotAvailability, setSlotAvailability] = useState<Map<string, number>>(new Map());
  const [daySlots, setDaySlots] = useState<PublicSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Free-slot count per date, for the calendar badges.
  const fetchAvailability = useCallback(async (monthDate: Date) => {
    try {
      const monthStr = monthDate.toISOString().slice(0, 7); // YYYY-MM
      const response = await axios.get(`/api/consultations/availability?date=${monthStr}`);
      const counts: Record<string, number> = response.data.data ?? {};
      setSlotAvailability(new Map(Object.entries(counts)));
    } catch {
      setSlotAvailability(new Map());
    }
  }, []);

  // The slots the admin actually opened on the selected date.
  const fetchDaySlots = useCallback(async (date: Date) => {
    setIsLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await axios.get(`/api/consultations/availability?date=${dateStr}`);
      setDaySlots(response.data.data ?? []);
    } catch {
      setDaySlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability(today);
  }, [fetchAvailability, today]);

  useEffect(() => {
    fetchDaySlots(formData.date);
  }, [formData.date, fetchDaySlots]);

  // Drop the selected time if it is no longer offered or no longer free.
  useEffect(() => {
    if (!formData.time) return;
    const stillBookable = daySlots.some((slot) => slot.startTime === formData.time && slot.isAvailable);
    if (!stillBookable) {
      setFormData((prev) => ({ ...prev, time: '' }));
    }
  }, [formData.time, daySlots]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: value }));
  };

  const handleDateSelect = useCallback((date: Date) => {
    setFormData((prev) => ({ ...prev, date }));
  }, []);

  const connectionOptions = [
    { value: 'Video Call', label: 'Video Call' },
    { value: 'Phone Call', label: 'Phone Call' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setMessage({ type: 'error', text: 'Please enter your full name.' });
      return;
    }

    const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
    if (formData.connectionType === 'Video Call') {
      if (!formData.email.trim()) {
        setMessage({ type: 'error', text: 'Please enter your email address for a Video Call.' });
        return;
      }
      if (!emailRegex.test(formData.email.trim())) {
        setMessage({ type: 'error', text: 'Please enter a valid email address.' });
        return;
      }
    }

    if (formData.connectionType === 'Phone Call') {
      if (!formData.mobile.trim()) {
        setMessage({ type: 'error', text: 'Please enter your mobile number for the call.' });
        return;
      }
      if (formData.mobile.length !== 10) {
        setMessage({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
        return;
      }
    }

    if (!formData.time) {
      setMessage({ type: 'error', text: 'Please select a time slot for your consultation.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/consultations', {
        ...formData,
        date: formData.date.toISOString().split('T')[0],
      });

      setMessage({
        type: 'success',
        text: 'Consultation scheduled successfully! Please check your email for the invite.',
      });

      trackLeadSubmitted({
        lead_type: 'free_1_on_1_assistance',
        source_page: pathname,
        connection_type: formData.connectionType,
      });

      // Push to Zoho CRM — fire-and-forget
      pushLead({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.mobile || undefined,
        source: 'Free Consultation',
        message: `Consultation scheduled for ${formData.date.toISOString().split('T')[0]} at ${formData.time} via ${formData.connectionType}`,
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        connectionType: 'Video Call',
        email: '',
        mobile: '',
        date: new Date(),
        time: '',
      });
    } catch (error: unknown) {
      let errorMsg = 'Failed to schedule consultation. Please try again.';
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || error.message || errorMsg;
        // Somebody took the slot first — refresh the day so it visibly disappears.
        if (error.response?.status === 409) {
          void fetchDaySlots(formData.date);
        }
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="assistance"
      className={`${styles.consultationSection} ${centerCard ? styles.consultationSectionCentered : ''}`}
    >
      <div className={`${styles.formCard} ${centerCard ? styles.formCardAligned : ''}`}>
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.titleWrapper}>
              <Icon icon={ICON_CHAT} className={styles.titleIcon} />
              <h2 className={styles.formTitle}>Free 1 on 1 Assistance</h2>
            </div>
            <p className={styles.formSubtitle}>
              Connect with our sleep experts for personalized guidance on your journey to better rest.
            </p>
          </div>
          <div className={styles.freeSessionBadge}>
            <span className={styles.badgeText}>Free Session</span>
            <span className={styles.badgeDuration}>30 minutes</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formLeft}>
              <Input
                label="First Name"
                labelIcon={<Icon icon={ICON_USER} className={styles.labelIcon} />}
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                containerClassName={styles.customInputContainer}
                className={styles.customInput}
                showRequiredIndicator
                required
              />

              <Input
                label="Last Name"
                labelIcon={<Icon icon={ICON_USER} className={styles.labelIcon} />}
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                containerClassName={styles.customInputContainer}
                className={styles.customInput}
                showRequiredIndicator
                required
              />

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <Icon icon={ICON_CALENDAR} className={styles.labelIcon} />
                  How would you like to connect?
                </label>
                <div className={styles.selectWrapper}>
                  <Icon
                    icon={formData.connectionType === 'Video Call' ? ICON_VIDEO : ICON_PHONE}
                    className={styles.selectIcon}
                    aria-hidden
                  />
                  <Dropdown
                    id="connectionType"
                    options={connectionOptions}
                    value={formData.connectionType}
                    onChange={(value) => setFormData({ ...formData, connectionType: value })}
                    ariaLabel="How would you like to connect?"
                    className={styles.connectionDropdown}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formRight}>
              {formData.connectionType === 'Video Call' ? (
                <div className={styles.inputGroup}>
                  <Input
                    label="Email Address"
                    labelIcon={<Icon icon={ICON_MAIL} className={styles.labelIcon} />}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    containerClassName={styles.customInputContainer}
                    className={styles.customInput}
                    showRequiredIndicator
                    required
                  />
                  <p className={styles.inputHint}>We&apos;ll send confirmation to this email.</p>
                </div>
              ) : (
                <div className={styles.inputGroup}>
                  <Input
                    label="Mobile Number"
                    labelIcon={<Icon icon={ICON_PHONE} className={styles.labelIcon} />}
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleMobileChange}
                    placeholder="9876543210"
                    containerClassName={styles.customInputContainer}
                    className={styles.customInput}
                    showRequiredIndicator
                    required
                  />
                  <p className={styles.inputHint}>We will call you on this number.</p>
                </div>
              )}

              <div className={styles.expectSection}>
                <h3 className={styles.expectTitle}>What to expect</h3>
                <ul className={styles.expectList}>
                  <li className={styles.expectItem}>Personalized sleep assessment</li>
                  <li className={styles.expectItem}>Custom recommendations</li>
                  <li className={styles.expectItem}>Answer to all your questions</li>
                </ul>
              </div>
            </div>

            <div className={styles.datetimeSelection}>
              <h3 className={styles.selectionTitle}>
                <Icon icon={ICON_CALENDAR} className={styles.labelIcon} />
                Select Date & Time
              </h3>
              <div className={styles.datetimeGrid}>
                <DatePicker
                  selectedDate={formData.date}
                  onDateSelect={handleDateSelect}
                  minDate={today}
                  slotAvailability={slotAvailability}
                  onMonthChange={fetchAvailability}
                />
                <div className={styles.timePicker}>
                  <h4 className={styles.inputLabel}>
                    <Icon icon={ICON_CLOCK} className={styles.labelIcon} />
                    Available Slots
                  </h4>
                  {isLoadingSlots ? (
                    <p className={styles.emptySlots}>Loading slots...</p>
                  ) : daySlots.length === 0 ? (
                    <p className={styles.emptySlots}>No slots available on this date. Please pick another day.</p>
                  ) : (
                    <TimeSlotGrid
                      slots={
                        daySlots.map((slot) => ({
                          _id: slot.startTime,
                          startTime: slot.startTime,
                          endTime: slot.endTime,
                          isAvailable: slot.isAvailable,
                          therapistId: 'consultation',
                          date: formData.date.toISOString().split('T')[0],
                          isCustomized: false,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        })) as TherapistSlot[]
                      }
                      selectedSlot={formData.time || null}
                      onSlotSelect={(id: string) => setFormData((prev) => ({ ...prev, time: id }))}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`${styles.message} ${message.type === 'success' ? styles.successMessage : styles.errorMessage}`}
            >
              {message.text}
            </div>
          )}

          <div className={styles.formFooter}>
            <Button type="submit" variant="primary" className={styles.submitButton} disabled={isSubmitting}>
              <Icon icon={ICON_CALENDAR} className={styles.buttonIcon} />
              {isSubmitting ? 'Scheduling...' : 'Schedule Free Consultation'}
            </Button>
            <p className={styles.footerText}>We&apos;ll respond within 24 hours to confirm your appointment</p>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AboutUsConsultation;
