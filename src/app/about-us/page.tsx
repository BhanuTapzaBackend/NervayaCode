import styles from './styles.module.css';
import AboutUsCards from '@/components/AboutUS/AboutUsCards';
import AboutUsTeam from '@/components/AboutUS/AboutUsTeam';
import AboutUsConsultation from '@/components/AboutUS/AboutUsConsultation';
import AboutUsStats from '@/components/AboutUS/AboutUsStats';

import Image from 'next/image';
import { IMAGES } from '@/utils/imageConstants';

const AboutUs = () => {
  return (
    <div className={styles.container}>
      <div className={styles.aboutUsSection}>
        <div className={styles.card}>
          <div className={styles.cardContent}>
            <h1 className={styles.aboutUsTitleInside}>About Us</h1>
            <span className={styles.missionTag}>Our Mission</span>
            <h2 className={styles.cardHeading}>Helping You Find Peace, Balance, and Restful Sleep</h2>
            <p className={styles.cardParagraph}>
              Struggling to unwind at night? At Nervaya, we take a holistic, science-backed approach to improving your
              sleep, starting with what your body needs most.
            </p>
            <p className={styles.cardParagraph}>
              Our carefully formulated herbal, Ayurvedic sleep supplements are designed to support your natural sleep
              cycle, reduce stress, and promote deeper, more restorative rest. Crafted using time-tested ingredients and
              modern research, they work gently with your body to improve both sleep onset and sleep quality without
              creating dependency.
            </p>
            <p className={styles.cardParagraph}>
              To complement this, we offer Deep Rest (formerly Drift Off) our guided audio experience designed to calm
              the mind, release mental tension, and ease you into natural sleep. It helps quiet overthinking, reduce
              nighttime anxiety, and create a consistent, relaxing transition into rest.
            </p>
            <p className={styles.cardParagraph}>
              For deeper emotional support, we provide access to expert-led stress and anxiety counselling, helping you
              address the underlying causes that disrupt your sleep and overall well-being.
            </p>
            <p className={styles.cardParagraph}>
              Our approach combines Ayurvedic supplementation, Deep Rest guided experiences, and therapeutic support
              creating a complete ecosystem for better sleep. We focus not just on falling asleep faster, but on helping
              you wake up feeling lighter, clearer, and truly restored.
            </p>
            <p className={styles.cardParagraph}>
              We’re here to support you at every step of your journey to better sleep and long-term mental wellness.
            </p>
          </div>
          <div className={styles.cardImageWrapper}>
            {IMAGES.ABOUT_US_MAIN && (
              <Image
                src={IMAGES.ABOUT_US_MAIN}
                alt="About Us"
                fill
                className={styles.cardImage}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </div>
        </div>
      </div>
      <AboutUsCards />
      <AboutUsTeam />
      <AboutUsStats />
      <AboutUsConsultation centerCard />
    </div>
  );
};

export default AboutUs;
