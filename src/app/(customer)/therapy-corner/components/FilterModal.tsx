import { useRef } from 'react';
import { Icon } from '@iconify/react';
import { ICON_X, ICON_LANGUAGES, ICON_USER_LUCIDE } from '@/constants/icons';
import { CustomDropdown } from '@/components/common/CustomDropdown';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import PriceRangeSlider from '@/components/Supplements/SupplementFilters/PriceRangeSlider';
import styles from '../styles.module.css';

import { FilterState } from '../page';
import MultiSelect from '@/components/common/MultiSelect/MultiSelect';

export interface FilterOptions {
  languages: string[];
  specializations: string[];
  genders: { label: string; value: string }[];
  experienceBounds: { min: number; max: number };
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: FilterOptions;
  state: FilterState;
  onStateChange: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  onApply: () => void;
  onClear: () => void;
}

export function FilterModal({ isOpen, onClose, options, state, onStateChange, onApply, onClear }: FilterModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalDismiss(isOpen, modalRef, onClose);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div ref={modalRef} className={styles.filterModal} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <h3>Filter Therapists</h3>
          <button type="button" className={styles.closeModalBtn} onClick={onClose} aria-label="Close filters">
            <Icon icon={ICON_X} width={24} height={24} />
          </button>
        </div>

        <div className={styles.filterFields}>
          <div className={styles.filterField}>
            <span>Qualification</span>
            <MultiSelect
              placeholder="Select Qualifications"
              values={state.specialization}
              onChange={(vals) => onStateChange('specialization', vals)}
              options={options.specializations.map((spec) => ({ value: spec, label: spec }))}
            />
          </div>

          <div className={styles.filterField}>
            <span>Language</span>
            <CustomDropdown
              placeholder="All Languages"
              value={state.language}
              onChange={(val) => onStateChange('language', val)}
              options={[
                { value: '', label: 'All Languages' },
                ...options.languages.map((lang) => ({ value: lang, label: lang })),
              ]}
              icon={ICON_LANGUAGES}
            />
          </div>

          <div className={styles.filterField}>
            <span>Gender</span>
            <CustomDropdown
              placeholder="Any Gender"
              value={state.gender}
              onChange={(val) => onStateChange('gender', val)}
              options={options.genders}
              icon={ICON_USER_LUCIDE}
            />
          </div>

          <div className={styles.filterField}>
            <span>Experience (yrs)</span>
            <div className={styles.experienceFilterBody}>
              <span className={styles.experienceValuePill}>
                {state.minExperience ? Number(state.minExperience) : options.experienceBounds.min}
              </span>
              <PriceRangeSlider
                min={options.experienceBounds.min}
                max={options.experienceBounds.max}
                valueMin={state.minExperience ? Number(state.minExperience) : options.experienceBounds.min}
                valueMax={state.maxExperience ? Number(state.maxExperience) : options.experienceBounds.max}
                onChange={(minV, maxV) => {
                  onStateChange('minExperience', minV > options.experienceBounds.min ? String(minV) : '');
                  onStateChange('maxExperience', maxV < options.experienceBounds.max ? String(maxV) : '');
                }}
                ariaLabelMin="Minimum experience"
                ariaLabelMax="Maximum experience"
              />
              <span className={styles.experienceValuePill}>
                {state.maxExperience ? Number(state.maxExperience) : options.experienceBounds.max}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.modalSecondaryBtn} onClick={onClear}>
            Clear
          </button>
          <button type="button" className={styles.modalPrimaryBtn} onClick={onApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
