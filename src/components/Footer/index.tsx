import Image from 'next/image';
import Link from 'next/link';
import { FOOTER_LINK_GROUPS, SOCIAL_LINKS } from '@/utils/footerConstants';
import styles from './styles.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles['footer-container']}>
      <div className={styles['footer-main']}>
        <div className={styles['brand-column']}>
          <Link href="/" className={styles['footer-logo-link']} aria-label="Nervaya Home">
            <Image
              src="/icons/nervaya-logo.jpg"
              width={400}
              height={130}
              className={styles['footer-logo']}
              alt="Nervaya"
            />
          </Link>
          <p className={styles['brand-copy']}>
            Personalized sleep care built to help you rest deeper and live lighter.
          </p>

          <ul className={styles['social-links']} aria-label="Social links">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles['social-link']}
                  aria-label={social.alt}
                >
                  <Image src={social.icon} width={22} height={22} alt="" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles['links-grid']}>
          {FOOTER_LINK_GROUPS.map((group) => (
            <section key={group.title} className={styles['link-box']} aria-label={group.title}>
              <h3 className={styles['link-title']}>{group.title}</h3>
              <ul className={styles['link-list']}>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles['link']}>
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className={styles['footer-bottom']}>
        <p className={styles['copyright']}>© {currentYear} Nervaya. All rights reserved.</p>
        <div className={styles['footer-bottom-links']}>
          <Link href="/privacy-policy" className={styles['bottom-link']}>
            Privacy
          </Link>
          <Link href="/delivery-policy" className={styles['bottom-link']}>
            Delivery
          </Link>
          <Link href="/terms-and-conditions" className={styles['bottom-link']}>
            Terms
          </Link>
          <Link href="/return-policy" className={styles['bottom-link']}>
            Return Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
