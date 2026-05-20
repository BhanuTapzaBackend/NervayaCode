import { memo, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { GridItem } from '@/utils/deliveryPolicyData';
import styles from './styles.module.css';

interface ContactItem {
  icon: string;
  label: string;
  text: string;
  href?: string;
}

interface InternalSubsection {
  title: string;
  paragraph?: string;
  listItems?: { label?: string; text: string }[];
  gridItems?: GridItem[];
  cookieCards?: GridItem[];
}

interface InternalSectionContent {
  paragraphs?: string[];
  subsections?: InternalSubsection[];
  gridItems?: GridItem[];
  securityCards?: GridItem[];
  cookieCards?: GridItem[];
  rightsCards?: GridItem[];
  contactItems?: ContactItem[];
}

interface SectionContentProps {
  content: InternalSectionContent;
}

const SectionContent = memo(({ content }: SectionContentProps) => {
  const paragraphs = useMemo(() => {
    return content.paragraphs?.map((paragraph: string) => {
      const keyBase = paragraph.substring(0, 50).replace(/\s+/g, '-');
      return (
        <p key={`paragraph-${keyBase}-${paragraph.length}`} className={styles.paragraph}>
          {paragraph}
        </p>
      );
    });
  }, [content.paragraphs]);

  const subsections = useMemo(() => {
    return content.subsections?.map((subsection: InternalSubsection) => {
      return (
        <div key={`subsection-${subsection.title}`} className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>{subsection.title}</h3>
          {subsection.paragraph && <p className={styles.paragraph}>{subsection.paragraph}</p>}
          {subsection.listItems && (
            <ul className={styles.list}>
              {subsection.listItems.map((item: { label?: string; text: string }) => (
                <li key={`${subsection.title}-${item.label}-${item.text}`}>
                  <strong>{item.label}</strong> {item.text}
                </li>
              ))}
            </ul>
          )}
          {subsection.cookieCards && (
            <div className={styles.cookieGrid}>
              {subsection.cookieCards.map((card: GridItem) => (
                <div key={`${subsection.title}-cookie-${card.title}`} className={styles.cookieCard}>
                  <div className={styles.cookieIcon}>
                    <Icon icon={card.icon} width={24} height={24} color="white" />
                  </div>
                  <h4 className={styles.cookieTitle}>{card.title}</h4>
                  <p className={styles.cookieText}>{card.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  }, [content.subsections]);

  const gridItems = useMemo(() => {
    return content.gridItems?.map((item: GridItem) => (
      <div key={`grid-${item.title}-${item.text}`} className={styles.gridItem}>
        <div className={styles.gridIcon}>
          <Icon icon={item.icon} width={28} height={28} color="white" />
        </div>
        <h4 className={styles.gridTitle}>{item.title}</h4>
        <p className={styles.gridText}>{item.text}</p>
      </div>
    ));
  }, [content.gridItems]);

  const securityCards = useMemo(() => {
    return content.securityCards?.map((card: GridItem) => (
      <div key={`security-${card.title}`} className={styles.securityCard}>
        <div className={styles.securityIcon}>
          <Icon icon={card.icon} width={24} height={24} color="white" />
        </div>
        <h4 className={styles.securityTitle}>{card.title}</h4>
        <p className={styles.securityText}>{card.text}</p>
      </div>
    ));
  }, [content.securityCards]);

  const rightsCards = useMemo(() => {
    return content.rightsCards?.map((card: GridItem) => (
      <div key={`rights-${card.title}-${card.text}`} className={styles.rightCard}>
        <div className={styles.rightIcon}>
          <Icon icon={card.icon} width={24} height={24} color="white" />
        </div>
        <h4 className={styles.rightTitle}>{card.title}</h4>
        <p className={styles.rightText}>{card.text}</p>
      </div>
    ));
  }, [content.rightsCards]);

  const contactItems = useMemo(() => {
    return content.contactItems?.map((item: ContactItem) => (
      <div key={`contact-${item.label}`} className={styles.contactItem}>
        <div className={styles.contactIcon}>
          <Icon icon={item.icon} width={20} height={20} color="white" />
        </div>
        <div className={styles.contactContent}>
          <strong className={styles.contactLabel}>{item.label}</strong>
          {item.href ? (
            <a href={item.href} className={styles.link}>
              {item.text}
            </a>
          ) : (
            <span className={styles.contactText}>{item.text}</span>
          )}
        </div>
      </div>
    ));
  }, [content.contactItems]);

  return (
    <>
      {paragraphs}

      {subsections && <>{subsections}</>}

      {gridItems && <div className={styles.grid}>{gridItems}</div>}

      {securityCards && <div className={styles.securityGrid}>{securityCards}</div>}

      {rightsCards && <div className={styles.rightsGrid}>{rightsCards}</div>}

      {contactItems && <div className={styles.contactInfo}>{contactItems}</div>}
    </>
  );
});

SectionContent.displayName = 'SectionContent';

export default SectionContent;
