import { useState, useEffect, useCallback } from 'react';
import { consultingHoursApi } from '@/lib/api/consultingHours';
import { DAYS_OF_WEEK, WEEKDAYS } from '@/lib/constants/consultingHours.constants';
import type { ConsultingHour } from '@/types/therapist.types';

interface UseConsultingHoursOptions {
  therapistId: string;
  onUpdate?: () => void;
}

export function useConsultingHours({ therapistId, onUpdate }: UseConsultingHoursOptions) {
  const [consultingHours, setConsultingHours] = useState<ConsultingHour[]>([]);
  const [savedHours, setSavedHours] = useState<ConsultingHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const fetchConsultingHours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await consultingHoursApi.get(therapistId);
      if (!result.success) return;
      if (!result.data || result.data.length === 0) {
        const defaultHours: ConsultingHour[] = DAYS_OF_WEEK.map((day) => ({
          dayOfWeek: day.value,
          startTime: '09:00 AM',
          endTime: '05:00 PM',
          isEnabled: false,
        }));
        setConsultingHours(defaultHours);
        setSavedHours([]);
      } else {
        const hours = result.data ?? [];
        const hoursMap = new Map<number, ConsultingHour>(hours.map((h) => [h.dayOfWeek, h]));
        const allHours: ConsultingHour[] = DAYS_OF_WEEK.map((day): ConsultingHour => {
          const existing = hoursMap.get(day.value);
          return (
            existing ?? {
              dayOfWeek: day.value,
              startTime: '09:00 AM',
              endTime: '05:00 PM',
              isEnabled: false,
            }
          );
        });
        setConsultingHours(allHours);
        setSavedHours(hours);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consulting hours');
    } finally {
      setLoading(false);
    }
  }, [therapistId]);

  useEffect(() => {
    fetchConsultingHours();
  }, [fetchConsultingHours]);

  const updateDayHours = useCallback((dayOfWeek: number, updates: Partial<ConsultingHour>) => {
    setConsultingHours((prev) => prev.map((hour) => (hour.dayOfWeek === dayOfWeek ? { ...hour, ...updates } : hour)));
  }, []);

  const handleUpdate = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    setGenerationStatus(null);
    try {
      const validHours = consultingHours.map((hour) => ({
        dayOfWeek: hour.dayOfWeek,
        startTime: hour.isEnabled ? hour.startTime : '09:00 AM',
        endTime: hour.isEnabled ? hour.endTime : '05:00 PM',
        isEnabled: hour.isEnabled,
      }));
      await consultingHoursApi.update(therapistId, validHours);
      setSuccess('Consulting hours saved successfully!');
      setSavedHours(validHours);
      await fetchConsultingHours();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update consulting hours');
    } finally {
      setSaving(false);
    }
  }, [therapistId, consultingHours, fetchConsultingHours, onUpdate]);

  const generateSlots = useCallback(
    async (days: number = 30) => {
      setGenerating(true);
      setGenerationStatus(`Generating slots for the next ${days} days...`);
      try {
        const result = await consultingHoursApi.generateSlots(therapistId, days);
        const inserted = result.data?.insertedCount || 0;
        const modified = result.data?.modifiedCount || 0;
        setGenerationStatus(`Successfully generated schedules! (${inserted} new, ${modified} updated)`);
        setTimeout(() => onUpdate?.(), 500);
      } catch (err) {
        setGenerationStatus(`Warning: ${err instanceof Error ? err.message : 'Failed to generate slots'}`);
      } finally {
        setGenerating(false);
      }
    },
    [therapistId, onUpdate],
  );

  const toggleDay = useCallback(
    (dayOfWeek: number) => {
      const hour = consultingHours.find((h) => h.dayOfWeek === dayOfWeek);
      if (hour) updateDayHours(dayOfWeek, { isEnabled: !hour.isEnabled });
    },
    [consultingHours, updateDayHours],
  );

  const applyToWeekdays = useCallback(() => {
    const monday = consultingHours.find((h) => h.dayOfWeek === 1);
    if (monday?.isEnabled) {
      WEEKDAYS.forEach((day) => {
        updateDayHours(day, {
          isEnabled: true,
          startTime: monday.startTime,
          endTime: monday.endTime,
        });
      });
    }
  }, [consultingHours, updateDayHours]);

  const applyToAllDays = useCallback(() => {
    const firstEnabled = consultingHours.find((h) => h.isEnabled);
    if (firstEnabled) {
      DAYS_OF_WEEK.forEach((day) => {
        updateDayHours(day.value, {
          isEnabled: true,
          startTime: firstEnabled.startTime,
          endTime: firstEnabled.endTime,
        });
      });
    }
  }, [consultingHours, updateDayHours]);

  const handleConfirmClear = useCallback(() => {
    DAYS_OF_WEEK.forEach((day) => {
      updateDayHours(day.value, {
        isEnabled: false,
        startTime: '09:00 AM',
        endTime: '05:00 PM',
      });
    });
    setShowConfirmDialog(false);
  }, [updateDayHours]);

  const hasEnabledDays = consultingHours.some((h) => h.isEnabled);
  const hasUnsavedChanges = JSON.stringify(consultingHours) !== JSON.stringify(savedHours);
  const isSaved = savedHours.length > 0 && !hasUnsavedChanges;

  return {
    consultingHours,
    loading,
    saving,
    generating,
    error,
    success,
    generationStatus,
    showConfirmDialog,
    setShowConfirmDialog,
    hasEnabledDays,
    hasUnsavedChanges,
    isSaved,
    fetchConsultingHours,
    handleUpdate,
    generateSlots,
    updateDayHours,
    toggleDay,
    applyToWeekdays,
    applyToAllDays,
    handleConfirmClear,
  };
}
