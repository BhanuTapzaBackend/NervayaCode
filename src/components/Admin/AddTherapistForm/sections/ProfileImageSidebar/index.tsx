import { Icon } from '@iconify/react';
import { ICON_CAMERA } from '@/constants/icons';
import ImageUpload from '@/components/ImageUpload/ImageUpload';
import fieldStyles from '../../fieldStyles.module.css';
import styles from './styles.module.css';

interface ProfileImageSidebarProps {
  imageUrl: string;
  onImageUpload: (url: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export const ProfileImageSidebar = ({ imageUrl, onImageUpload, onLoadingChange }: ProfileImageSidebarProps) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Icon icon={ICON_CAMERA} />
        </div>
        <div>
          <h3 className={styles.title}>Profile Photo</h3>
          <p className={styles.subtitle}>Main image for therapist profile</p>
        </div>
      </div>

      <div className={styles.imageUploadWrapper}>
        <ImageUpload
          onUpload={onImageUpload}
          onLoadingChange={onLoadingChange}
          initialUrl={imageUrl}
          label="Upload photo"
          tone="light"
        />
      </div>
      <span className={fieldStyles.hint}>Square, 400x400px min. Photo is optional—you can add it later.</span>
    </aside>
  );
};
