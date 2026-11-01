import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/admin';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Admin session terminated.',
  });

  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
