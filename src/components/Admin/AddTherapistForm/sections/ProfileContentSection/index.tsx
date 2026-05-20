import { FormSection } from '../FormSection';
import fieldStyles from '../../fieldStyles.module.css';
import styles from './styles.module.css';
import type { TherapistFormFieldsProps } from '../../formData';

export function ProfileContentSection({ formData, onChange }: TherapistFormFieldsProps) {
  return (
    <FormSection>
      <div className={styles.content}>
        <div className={fieldStyles.formGroup}>
          <label className={fieldStyles.label} htmlFor="bio">
            Short Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={onChange}
            className={fieldStyles.input}
            rows={2}
            placeholder="One-line therapist intro"
          />
        </div>
        <div className={fieldStyles.formGroup}>
          <label className={fieldStyles.label} htmlFor="bioLong">
            Long Bio
          </label>
          <textarea
            id="bioLong"
            name="bioLong"
            value={formData.bioLong}
            onChange={onChange}
            className={fieldStyles.input}
            rows={5}
            placeholder="Detailed therapist biography for profile page"
          />
        </div>
        <div className={fieldStyles.formGroup}>
          <label className={fieldStyles.label} htmlFor="quote">
            Quote
          </label>
          <textarea
            id="quote"
            name="quote"
            value={formData.quote}
            onChange={onChange}
            className={fieldStyles.input}
            rows={2}
            placeholder="Healing quote shown on profile"
          />
        </div>
        <div className={fieldStyles.formGroup}>
          <label className={fieldStyles.label} htmlFor="messageToClient">
            Message to Client
          </label>
          <textarea
            id="messageToClient"
            name="messageToClient"
            value={formData.messageToClient}
            onChange={onChange}
            className={fieldStyles.input}
            rows={4}
            placeholder="Warm message block shown in profile page"
          />
        </div>
        <div className={fieldStyles.formGroup}>
          <label className={fieldStyles.label} htmlFor="testimonials">
            Testimonials
          </label>
          <textarea
            id="testimonials"
            name="testimonials"
            value={formData.testimonials}
            onChange={onChange}
            className={fieldStyles.input}
            rows={5}
            placeholder="One per line: Name | Client since 2023 | Testimonial message"
          />
          <span className={fieldStyles.hint}>Format: Name | Client since YYYY | Message</span>
        </div>
      </div>
    </FormSection>
  );
}
