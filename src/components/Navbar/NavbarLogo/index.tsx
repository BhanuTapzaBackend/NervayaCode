import Link from 'next/link';
import Image from 'next/image';
import styles from './styles.module.css';

export function NavbarLogo() {
  return (
    <div className={styles.navbarLogo}>
      <Link href="/">
        <Image src="/icons/nervaya-logo.jpg" alt="Nervaya logo" width={540} height={180} priority />
      </Link>
    </div>
  );
}

export default NavbarLogo;
