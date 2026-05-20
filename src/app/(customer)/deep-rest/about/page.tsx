import Link from 'next/link';
import Sidebar from '@/components/Sidebar/LazySidebar';
import WhyChooseSection from '@/components/DeepRest/WhyChooseSection';
import DriftOffAboutHowItWorks from '@/components/DeepRest/DriftOffAboutHowItWorks';
import WhatMakesDifferentSection from '@/components/DeepRest/WhatMakesDifferentSection';
import PageHeader from '@/components/PageHeader/PageHeader';
import styles from './styles.module.css';

export default function DriftOffAboutPage() {
  return (
    <Sidebar className={styles.pageContentWhite}>
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <PageHeader
            title="What Are Deep Rest Sessions?"
            subtitle="Deep Rest Sessions are 25-minute personalized audio experiences designed for anyone who struggles to unwind or fall asleep. They blend gentle hypnotic guidance with neuroplasticity-backed techniques to help your mind and body transition into deep, restorative rest."
            actions={
              <Link href="/deep-rest/payment" className={styles.headerBtn}>
                Buy Session
              </Link>
            }
          />

          <section className={styles.section} aria-labelledby="why-choose-heading">
            <h2 id="why-choose-heading" className={styles.sectionTitle}>
              Why Choose Deep Rest Sessions?
            </h2>
            <WhyChooseSection />
          </section>

          <section className={styles.section} aria-labelledby="how-it-works-heading">
            <DriftOffAboutHowItWorks sectionTitle="How Deep Rest Sessions Work" sectionTitleId="how-it-works-heading" />
          </section>

          <section className={styles.section} aria-labelledby="what-makes-heading">
            <h2 id="what-makes-heading" className={styles.sectionTitle}>
              What Makes Deep Rest Sessions Different?
            </h2>
            <WhatMakesDifferentSection />
          </section>
        </div>
      </div>
    </Sidebar>
  );
}
