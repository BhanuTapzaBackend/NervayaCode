import Sidebar from '@/components/Sidebar/LazySidebar';
import SupportHeader from '@/components/Support/SupportHeader';
import ChatWithUs from '@/components/Support/ChatWithUs';
import SupportExpectations from '@/components/Support/SupportExpectations';
import FrequentlyAskedQuestions from '@/components/Support/FrequentlyAskedQuestions';
import AboutUsConsultation from '@/components/AboutUS/AboutUsConsultation';
import styles from './support.module.css';

const SupportPage = () => {
  return (
    <Sidebar>
      <div className={styles.page}>
        <div className={styles.pageInner}>
          <SupportHeader />
          <ChatWithUs />
          <SupportExpectations />
          <FrequentlyAskedQuestions />

          <section className={styles.consultation} aria-label="Book a free consultation">
            <div className={styles.consultationHead}>
              <span className={styles.eyebrow}>BOOK A CALL</span>
              <h2 className={styles.consultationTitle}>Prefer to talk it through?</h2>
              <p className={styles.consultationSubtitle}>
                Book a free 30-minute session with a sleep expert - no commitment, just clear guidance.
              </p>
            </div>
            <AboutUsConsultation centerCard />
          </section>
        </div>
      </div>
    </Sidebar>
  );
};

export default SupportPage;
