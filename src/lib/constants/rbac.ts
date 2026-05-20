import { ROLES, Role } from '@/lib/constants/roles';
import { ADMIN_ROUTES, PROTECTED_ROUTES, THERAPIST_ROUTES } from '@/utils/routesConstants';

export function hasRole(user: { role: Role } | null, role: Role): boolean {
  if (!user) return false;
  return user.role === role;
}

export function canAccessAdminRoute(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function canAccessTherapistRoute(role: Role): boolean {
  return role === ROLES.THERAPIST;
}

export function getAllowedRolesForRoute(path: string): Role[] | null {
  if (ADMIN_ROUTES.some((route) => path.startsWith(route))) {
    return [ROLES.ADMIN];
  }
  if (THERAPIST_ROUTES.some((route) => path.startsWith(route))) {
    return [ROLES.THERAPIST];
  }
  if (PROTECTED_ROUTES.some((route) => path.startsWith(route))) {
    return [ROLES.ADMIN, ROLES.CUSTOMER, ROLES.THERAPIST];
  }
  return null;
}
