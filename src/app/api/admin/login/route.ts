import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminCredentials, ADMIN_COOKIE_NAME, ADMIN_TOKEN_VALUE } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!checkAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Invalid admin credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
      redirect: '/admin',
    });

    // Set secure HTTP-only cookie lasting 7 days
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: ADMIN_TOKEN_VALUE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during admin authentication.' },
      { status: 500 }
    );
  }
}
