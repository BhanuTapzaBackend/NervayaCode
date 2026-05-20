import Sidebar from '@/components/Sidebar/LazySidebar';
import MySessionsSection from '@/components/DeepRest/MySessionsSection';
import PageHeader from '@/components/PageHeader/PageHeader';
import styles from './styles.module.css';

export default function DriftOffSessionsPage() {
  return (
    <Sidebar>
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <PageHeader title="My Deep Rest Sessions" subtitle="View and manage your personalized Deep Rest Sessions" />

          <section className={styles.section} aria-labelledby="my-sessions-heading">
            <h2 id="my-sessions-heading" className={styles.sectionTitle}>
              Your Sessions
            </h2>
            <MySessionsSection />
          </section>
        </div>
      </div>
    </Sidebar>
  );
}
