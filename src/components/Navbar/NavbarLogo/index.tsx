import Link from 'next/link';
import Image from 'next/image';
import styles from './styles.module.css';

interface NavbarLogoProps {
  isAuthPage?: boolean;
}

export function NavbarLogo({ isAuthPage = false }: NavbarLogoProps) {
  const logoWidth = isAuthPage ? 640 : 540;
  const logoHeight = isAuthPage ? 220 : 180;

  return (
    <div className={styles.navbarLogo}>
      <Link href="/">
        <Image src="/icons/nervaya-logo.jpg" alt="Nervaya logo" width={logoWidth} height={logoHeight} priority />
      </Link>
    </div>
  );
}

export default NavbarLogo;
