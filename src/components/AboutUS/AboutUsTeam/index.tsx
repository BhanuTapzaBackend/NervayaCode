import styles from './styles.module.css';
import { aboutUsTeamData } from '@/utils/aboutUsTeamData';
import Image from 'next/image';

const AboutUsTeam = () => {
  return (
    <section className={styles.teamSection}>
      <div className={styles.teamMainCard}>
        <div className={styles.teamHeader}>
          <h2 className={styles.teamTitle}>Meet Our Founding Team</h2>
          <p className={styles.teamSubtitle}>
            Visionary leaders committed to transforming mental health and sleep wellness through innovation and
            compassionate care.
          </p>
        </div>
        <ul className={styles.teamContainer}>
          {aboutUsTeamData.map((member) => (
            <li key={member.id} className={styles.memberCard}>
              <div className={styles.cardImagePlaceholder}>
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className={styles.cardImage}
                    sizes="(max-width: 768px) 80px, 100px"
                  />
                ) : null}
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.memberName}>{member.name}</h3>
                <p className={styles.memberTitle}>{member.title}</p>
                <p className={styles.memberDescription}>{member.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default AboutUsTeam;
