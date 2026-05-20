'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CHEVRON_DOWN } from '@/constants/icons';
import { NAVBAR_PRODUCTS_LINKS } from '@/utils/navbarConstants';
import { ROUTES } from '@/utils/routesConstants';
import { Dropdown } from '@/components/common/Dropdown';
import NavbarAccountLink from '../NavbarAccountLink';
import styles from './styles.module.css';

interface NavbarMenuProps {
  isAuthenticated: boolean;
  isMobileMenuOpen: boolean;
  isMobileViewport: boolean;
  pathname: string;
  dashboardHref: string;
  accountHref: string;
  accountLabel: string;
  onCloseMobileMenu: () => void;
}

interface AuthTailItemsProps {
  isAuthenticated: boolean;
  isMobileViewport: boolean;
  pathname: string;
  accountHref: string;
  accountLabel: string;
  isAccountPage: boolean;
  onCloseMobileMenu: () => void;
}

function AuthTailItems({
  isAuthenticated,
  isMobileViewport,
  pathname,
  accountHref,
  accountLabel,
  isAccountPage,
  onCloseMobileMenu,
}: Readonly<AuthTailItemsProps>) {
  if (isAuthenticated && isMobileViewport) {
    return (
      <li>
        <NavbarAccountLink
          href={accountHref}
          label={accountLabel}
          isActive={isAccountPage}
          onClick={onCloseMobileMenu}
        />
      </li>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const isAuthRoute = pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP;
  return (
    <>
      <li>
        <Link
          href={ROUTES.LOGIN || ROUTES.SIGNUP}
          onClick={onCloseMobileMenu}
          aria-current={isAuthRoute ? 'page' : undefined}
        >
          Log in / Sign up
        </Link>
      </li>
      <li>
        <button type="button" className={styles.navbarCta} onClick={onCloseMobileMenu}>
          Contact Us
        </button>
      </li>
    </>
  );
}

export function NavbarMenu({
  isAuthenticated,
  isMobileMenuOpen,
  isMobileViewport,
  pathname,
  dashboardHref,
  accountHref,
  accountLabel,
  onCloseMobileMenu,
}: Readonly<NavbarMenuProps>) {
  const isAccountPage = pathname === ROUTES.ADMIN_DASHBOARD || pathname?.startsWith('/account');
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [prevMenuOpen, setPrevMenuOpen] = useState(isMobileMenuOpen);

  if (prevMenuOpen !== isMobileMenuOpen) {
    setPrevMenuOpen(isMobileMenuOpen);
    if (!isMobileMenuOpen) setIsMobileProductsOpen(false);
  }

  const handleMobileProductClick = () => {
    setIsMobileProductsOpen(false);
    onCloseMobileMenu();
  };

  return (
    <div
      className={`${styles.drawer} ${isMobileMenuOpen ? styles.drawerOpen : ''}`}
      aria-hidden={isMobileViewport && !isMobileMenuOpen ? true : undefined}
      inert={isMobileViewport && !isMobileMenuOpen}
    >
      {isMobileViewport && (
        <Link href="/" className={styles.drawerLogo} onClick={onCloseMobileMenu} aria-label="Nervaya home">
          <Image src="/icons/nervaya-logo.jpg" alt="" width={180} height={60} priority />
        </Link>
      )}
      <ul className={styles.navbarMenu}>
        <li>
          <Link href="/" onClick={onCloseMobileMenu} aria-current={pathname === '/' ? 'page' : undefined}>
            Home
          </Link>
        </li>
        <li className={styles.navbarDropdown}>
          {isMobileViewport ? (
            <>
              <button
                type="button"
                className={`${styles.navbarDropdownButton} ${isMobileProductsOpen ? styles.navbarDropdownButtonOpen : ''}`}
                onClick={() => setIsMobileProductsOpen((prev) => !prev)}
                aria-expanded={isMobileProductsOpen}
              >
                Products
                <Icon icon={ICON_CHEVRON_DOWN} className={styles.dropdownArrow} width={16} height={16} />
              </button>
              {isMobileProductsOpen && (
                <ul className={styles.mobileSubmenu}>
                  {NAVBAR_PRODUCTS_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={handleMobileProductClick}>
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <Dropdown
              variant="navbar"
              modal={false}
              options={NAVBAR_PRODUCTS_LINKS.map((link) => ({
                label: link.text,
                value: link.href,
                href: link.href,
                onClick: onCloseMobileMenu,
              }))}
              trigger={
                <button className={styles.navbarDropdownButton}>
                  Products
                  <Icon icon={ICON_CHEVRON_DOWN} className={styles.dropdownArrow} width={16} height={16} />
                </button>
              }
            />
          )}
        </li>
        {isAuthenticated && (
          <li>
            <Link
              href={dashboardHref}
              onClick={onCloseMobileMenu}
              aria-current={pathname === ROUTES.DASHBOARD || pathname === ROUTES.ADMIN_DASHBOARD ? 'page' : undefined}
            >
              Dashboard
            </Link>
          </li>
        )}
        <li>
          <Link
            href="/about-us"
            onClick={onCloseMobileMenu}
            aria-current={pathname === '/about-us' ? 'page' : undefined}
          >
            About Us
          </Link>
        </li>

        <AuthTailItems
          isAuthenticated={isAuthenticated}
          isMobileViewport={isMobileViewport}
          pathname={pathname}
          accountHref={accountHref}
          accountLabel={accountLabel}
          isAccountPage={isAccountPage}
          onCloseMobileMenu={onCloseMobileMenu}
        />
      </ul>
    </div>
  );
}

export default NavbarMenu;
