import Sidebar from '@/components/Sidebar/LazySidebar';
import { DeepRestPageTracker } from './DeepRestPageTracker';
import DriftOffLandingHero from '@/components/DeepRest/DriftOffLandingHero';
import HowItWorks from '@/components/DeepRest/HowItWorks';
import PlaylistSection from '@/components/DeepRest/PlaylistSection';
import SupportCards from '@/components/DeepRest/SupportCards';
import TestimonialsWithData from '@/components/DeepRest/Testimonials/TestimonialsWithData';
import PageHeader from '@/components/PageHeader/PageHeader';
import styles from './styles.module.css';

export default function DriftOffPage() {
  return (
    <Sidebar className={styles.pageContentWhite}>
      <DeepRestPageTracker />
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <PageHeader
            title="Deep Rest Sessions"
            subtitle="Curated sessions targeting your mental well-being and neuroplasticity."
          />

          <DriftOffLandingHero />

          <section className={styles.section} aria-labelledby="how-it-works-heading">
            <h2 id="how-it-works-heading" className={styles.sectionTitle}>
              How It Works
            </h2>
            <HowItWorks />
          </section>

          <section className={styles.section} aria-labelledby="playlists-heading">
            <h2 id="playlists-heading" className={styles.sectionTitle}>
              Playlists Made For You
            </h2>
            <PlaylistSection />
          </section>

          <section className={styles.section} aria-labelledby="support-heading">
            <h2 id="support-heading" className={styles.sectionTitle}>
              Support & Assistance
            </h2>
            <SupportCards />
          </section>

          <TestimonialsWithData sectionClassName={styles.section} titleClassName={styles.sectionTitle} />
        </div>
      </div>
    </Sidebar>
  );
}
