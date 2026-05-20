import { GENDER_OPTIONS } from '@/lib/constants/enums';
import { FormSection } from '../FormSection';
import { Dropdown, type DropdownOption } from '@/components/common';
import fieldStyles from '../../fieldStyles.module.css';
import styles from './styles.module.css';
import type { TherapistFormFieldsProps, TherapistFormChangeEvent } from '../../formData';

export function BasicInformationSection({ formData, onChange }: TherapistFormFieldsProps) {
  return (
    <FormSection>
      <div className={styles.content}>
        <div className={fieldStyles.formRow}>
          <div className={fieldStyles.formGroup}>
            <label className={fieldStyles.label} htmlFor="name">
              Full Name <span className={fieldStyles.required}>*</span>
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={onChange}
              required
              className={fieldStyles.input}
              placeholder="Dr. John Smith"
            />
          </div>
          <div className={fieldStyles.formGroup}>
            <label className={fieldStyles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              className={fieldStyles.input}
              placeholder="john.smith@example.com"
            />
          </div>
        </div>

        <div className={fieldStyles.formRow}>
          <div className={fieldStyles.formGroup}>
            <label className={fieldStyles.label} htmlFor="experience">
              Experience (Years) <span className={fieldStyles.required}>*</span>
            </label>
            <input
              id="experience"
              name="experience"
              type="number"
              value={formData.experience}
              onChange={onChange}
              required
              className={fieldStyles.input}
              placeholder="e.g. 10"
              min="0"
            />
          </div>
          <div className={fieldStyles.formGroup}>
            <label className={fieldStyles.label} htmlFor="gender">
              Gender <span className={fieldStyles.required}>*</span>
            </label>
            <Dropdown
              id="gender"
              options={GENDER_OPTIONS as unknown as DropdownOption[]}
              value={formData.gender}
              onChange={(value) =>
                onChange({
                  target: { name: 'gender', value },
                } as unknown as TherapistFormChangeEvent)
              }
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
