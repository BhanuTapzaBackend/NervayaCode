import { FormSection } from '../FormSection';
import fieldStyles from '../../fieldStyles.module.css';
import styles from './styles.module.css';
import type { TherapistFormFieldsProps } from '../../formData';
import { TagInput } from '@/components/common';

export function ProfessionalDetailsSection({
  formData,
  onChange: _onChange,
  onTagChange,
}: TherapistFormFieldsProps & {
  onTagChange: (field: keyof import('../../formData').TherapistFormData, tags: string[]) => void;
}) {
  return (
    <FormSection>
      <div className={styles.content}>
        <div className={fieldStyles.formRow}>
          <div className={fieldStyles.formGroup}>
            <label className={fieldStyles.label} htmlFor="qualifications">
              Qualifications <span className={fieldStyles.required}>*</span>
            </label>
            <TagInput
              id="qualifications"
              tags={
                formData.qualifications
                  ? formData.qualifications
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : []
              }
              onChange={(tags) => onTagChange('qualifications', tags)}
              placeholder="Add qualification..."
            />
          </div>
          <div className={fieldStyles.formGroup}>
            <label className={fieldStyles.label} htmlFor="specializations">
              Specializations <span className={fieldStyles.required}>*</span>
            </label>
            <TagInput
              id="specializations"
              tags={
                formData.specializations
                  ? formData.specializations
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : []
              }
              onChange={(tags) => onTagChange('specializations', tags)}
              placeholder="Add specialization..."
            />
          </div>
        </div>

        <div className={fieldStyles.formRow}>
          <div className={fieldStyles.formGroup}>
            <label className={fieldStyles.label} htmlFor="languages">
              Languages <span className={fieldStyles.required}>*</span>
            </label>
            <TagInput
              id="languages"
              tags={
                formData.languages
                  ? formData.languages
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : []
              }
              onChange={(tags) => onTagChange('languages', tags)}
              placeholder="Add language..."
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
