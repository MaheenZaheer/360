import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export const ADMIN_USERNAME = 'FeedBack@360';
export const ADMIN_PASSWORD = 'ppooiiuu';
export const ADMIN_COOKIE_NAME = 'feedback360_admin_session';
export const ADMIN_TOKEN_VALUE = 'fb360_super_admin_authenticated_session';

export function checkAdminCredentials(username?: string | null, password?: string | null): boolean {
  if (!username || !password) return false;
  const cleanUser = username.trim().toLowerCase();
  const validUsers = ['feedback@360', 'feedback@360.com', 'admin@feedback360.com'];
  
  return validUsers.includes(cleanUser) && password === ADMIN_PASSWORD;
}

export async function isServerAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return token === ADMIN_TOKEN_VALUE;
  } catch {
    return false;
  }
}

export function isRequestAdmin(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return token === ADMIN_TOKEN_VALUE;
}
