import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_USER } from '@/constants/icons';
import styles from './styles.module.css';

interface NavbarAccountLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  desktop?: boolean;
}

export function NavbarAccountLink({ href, label, isActive, onClick, desktop = false }: NavbarAccountLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${styles.accountButton} ${desktop ? styles.desktopAccountButton : ''}`.trim()}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon icon={ICON_USER} width={20} height={20} />
      <span>{label}</span>
    </Link>
  );
}

export default NavbarAccountLink;
