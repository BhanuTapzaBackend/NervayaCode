'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { hasRole } from '@/lib/constants/rbac';
import { ROLES } from '@/lib/constants/roles';
import { ROUTES, AUTH_ROUTES } from '@/utils/routesConstants';
import styles from './styles.module.css';
import NavbarLogo from './NavbarLogo';
import NavbarMenu from './NavbarMenu';
import NavbarCartPreview from './NavbarCartPreview';
import NavbarAccountLink from './NavbarAccountLink';

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = hasRole(user, ROLES.ADMIN);
  const pathname = usePathname();
  const isAuthPage = (AUTH_ROUTES as readonly string[]).includes(pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrollDownStyleActive, setIsScrollDownStyleActive] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const closeMenus = () => {
      setIsMobileMenuOpen(false);
    };
    const id = requestAnimationFrame(closeMenus);
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollYRef.current + 4;
      const isScrollingUp = currentScrollY < lastScrollYRef.current - 4;

      if (currentScrollY <= 16) {
        setIsScrollDownStyleActive(false);
      } else if (isScrollingDown) {
        setIsScrollDownStyleActive(true);
      } else if (isScrollingUp) {
        setIsScrollDownStyleActive(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileViewport(mobile);

      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isProfessional = isAdmin || hasRole(user, ROLES.THERAPIST);
  const shouldShowCartPreview = !isProfessional;
  const dashboardHref = isAuthenticated
    ? isAdmin
      ? ROUTES.ADMIN_DASHBOARD
      : ROUTES.DASHBOARD
    : `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(ROUTES.DASHBOARD)}`;
  const accountHref = isAdmin ? ROUTES.ADMIN_DASHBOARD : '/account';
  const accountLabel = isAdmin ? 'Admin' : user?.name?.split(' ')[0] || 'Account';

  // Auth pages (/login, /signup) render a full-bleed split-screen experience with
  // their own branding — no global navbar.
  // The therapist area ships its own top bar inside TherapistShell. Rendering
  // the global one too stacks a fixed dark header over the shell's grid, which
  // is what the current /therapist/schedule page shows.
  if (pathname.startsWith('/therapist')) {
    return null;
  }

  if (isAuthPage) {
    return null;
  }

  return (
    <nav
      className={`${styles.navbar} ${styles.navbarMain} ${isScrollDownStyleActive ? styles.navbarScrolledDown : ''}`}
    >
      <div className={styles.navbarContainer}>
        <div className={`${styles.navbarLeft} ${isMobileMenuOpen ? styles.navbarLeftHiddenMobile : ''}`}>
          <NavbarLogo />
        </div>
        <div className={styles.navbarRight}>
          <NavbarMenu
            isAuthenticated={isAuthenticated}
            isMobileMenuOpen={isMobileMenuOpen}
            isMobileViewport={isMobileViewport}
            pathname={pathname}
            dashboardHref={dashboardHref}
            accountHref={accountHref}
            accountLabel={accountLabel}
            onCloseMobileMenu={closeMobileMenu}
          />

          <div className={styles.navbarUtilityActions}>
            <NavbarCartPreview visible={shouldShowCartPreview} onNavigate={closeMobileMenu} />

            {isAuthenticated && !isMobileViewport && (
              <NavbarAccountLink
                href={accountHref}
                onClick={closeMobileMenu}
                label={accountLabel}
                isActive={pathname === ROUTES.ADMIN_DASHBOARD || pathname?.startsWith('/account')}
                desktop
              />
            )}
          </div>

          <button
            className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className={styles.hamburgerBar}></span>
            <span className={styles.hamburgerBar}></span>
            <span className={styles.hamburgerBar}></span>
          </button>
        </div>

        {isMobileMenuOpen && (
          <button type="button" className={styles.mobileOverlay} onClick={closeMobileMenu} aria-label="Close menu" />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
