'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ICON_ARROW_UP } from '@/constants/icons';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { primaryNavItems, moreNavItems, type BottomNavItem } from '@/utils/bottomNavigationConstants';
import { AUTH_ROUTES } from '@/utils/routesConstants';
import { iconMap } from '@/utils/sidebarConstants';
import { checkIsActivePath } from '@/utils/navigationUtils';
import { hasRole } from '@/lib/constants/rbac';
import { ROLES } from '@/lib/constants/roles';
import styles from './BottomNavigation.module.css';

const BottomNavigation = () => {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { isAuthenticated, logout, user } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isProfessional = hasRole(user, ROLES.ADMIN) || hasRole(user, ROLES.THERAPIST);
  const isAuthPage = (AUTH_ROUTES as readonly string[]).includes(pathname as string);

  if (isAuthPage || isProfessional || !isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => {
    return checkIsActivePath(
      pathname,
      path,
      [...primaryNavItems, ...moreNavItems].map((i) => i.path),
    );
  };

  const showBadge = (path: string, title: string) => (path === '/cart' || title === 'Cart') && cartCount > 0;

  const NavLinkItem = ({ item }: { item: BottomNavItem }) => {
    const active = isActive(item.path);
    const badge = showBadge(item.path, item.title);

    return (
      <li key={item.path} className={styles.navItem}>
        <Link
          href={item.path}
          className={`${styles.navLink} ${active ? styles.active : ''}`}
          aria-current={active ? 'page' : undefined}
          onClick={() => setIsMoreOpen(false)}
        >
          <span className={styles.iconWrapper}>
            <span className={styles.icon}>
              <Icon icon={iconMap[item.icon] || item.icon} />
            </span>
            {badge && <span className={styles.badge}>{cartCount}</span>}
          </span>
          <span className={styles.label}>{item.title}</span>
        </Link>
      </li>
    );
  };

  const MoreIconLink = ({ item }: { item: BottomNavItem }) => {
    const active = isActive(item.path);

    return (
      <li key={item.path} className={styles.moreIconItem}>
        <Link
          href={item.path}
          className={`${styles.moreIconLink} ${active ? styles.active : ''}`}
          aria-current={active ? 'page' : undefined}
          aria-label={item.title}
          onClick={() => setIsMoreOpen(false)}
        >
          <span className={styles.moreIcon}>
            <Icon icon={iconMap[item.icon] || item.icon} />
          </span>
          <span className={styles.label}>{item.title}</span>
        </Link>
      </li>
    );
  };

  const hasActiveInMore = moreNavItems.some((item) => isActive(item.path));

  return (
    <nav className={styles.bottomNav} aria-label="Bottom navigation">
      {isMoreOpen && (
        <div className={styles.morePanel} role="dialog" aria-label="More navigation options">
          <ul className={styles.moreList}>
            {moreNavItems.map((item) => (
              <MoreIconLink key={item.path} item={item} />
            ))}
            {isAuthenticated && (
              <li className={styles.moreIconItem}>
                <button
                  className={`${styles.moreIconLink} ${styles.logoutButton}`}
                  onClick={() => {
                    logout();
                    setIsMoreOpen(false);
                  }}
                  aria-label="Logout"
                >
                  <span className={`${styles.moreIcon} ${styles.logoutIcon}`}>
                    <Icon icon={iconMap['FaRightFromBracket']} />
                  </span>
                  <span className={`${styles.label} ${styles.logoutLabel}`}>Logout</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
      <div className={styles.navBar}>
        <ul className={styles.navList}>
          {primaryNavItems.map((item) => (
            <NavLinkItem key={item.path} item={item} />
          ))}
          <li className={styles.navItem}>
            <button
              type="button"
              className={`${styles.moreButton} ${isMoreOpen || hasActiveInMore ? styles.active : ''}`}
              onClick={() => setIsMoreOpen((prev) => !prev)}
              aria-label={isMoreOpen ? 'Collapse more options' : 'Expand more options'}
              aria-expanded={isMoreOpen}
            >
              <span className={`${styles.iconWrapper} ${isMoreOpen ? styles.chevronUp : ''}`}>
                <Icon icon={ICON_ARROW_UP} width={20} height={20} className={styles.chevronIcon} />
              </span>
              <span className={styles.label}>More</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default BottomNavigation;
