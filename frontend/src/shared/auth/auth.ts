import type { IUser } from '@/domains/users/types/user';

export const Tingkat = {
  KARYAWAN: '0',
  PENGURUS: '1',
  SUPER_ADMIN: '2',
  SYSTEM_ADMIN: '5',
} as const;

export function isAdmin(user: IUser | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const tingkat = user.dbflpass?.tingkat;
  return tingkat === Tingkat.SUPER_ADMIN || tingkat === Tingkat.PENGURUS || tingkat === Tingkat.SYSTEM_ADMIN;
}

export function isKaryawan(user: IUser | null): boolean {
  if (!user) return false;
  if (user.role === 'karyawan') return true;
  return user.dbflpass?.tingkat === Tingkat.KARYAWAN;
}

/**
 * Returns the dashboard home path for the given user based on their role and Tingkat level.
 */
export function getHomePath(user: IUser | null): string {
  if (!user) return '/login';
  
  if (isAdmin(user)) {
    return '/admin/dashboard';
  }
  
  return '/karyawan/dashboard';
}

/**
 * Returns a valid redirect path ensuring the user has the correct role
 * for the requested path, otherwise falls back to their home path.
 */
export function getRedirectPath(user: IUser | null, redirectPath?: string): string {
  const homePath = getHomePath(user);
  if (!redirectPath) return homePath;

  // Prevent open redirects
  if (redirectPath.startsWith('http') || redirectPath.startsWith('//')) {
    return homePath;
  }

  // Check admin routes
  if (redirectPath.startsWith('/admin')) {
    return isAdmin(user) ? redirectPath : homePath;
  }

  // Check karyawan routes
  if (redirectPath.startsWith('/karyawan')) {
    return isKaryawan(user) || isAdmin(user) ? redirectPath : homePath;
  }

  return redirectPath;
}

