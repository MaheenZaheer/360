import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRequestAdmin } from '@/lib/admin';

function getAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Use service role key if available to bypass all RLS policies, otherwise anon key
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    const supabase = getAdminSupabaseClient();

    // 1. Fetch all businesses
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (bizError) {
      console.error('Admin fetch businesses error:', bizError);
    }

    // 2. Fetch all reviews
    const { data: reviews, error: revError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (revError) {
      console.error('Admin fetch reviews error:', revError);
    }

    // 3. Fetch all profiles if accessible
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // 4. Compute platform statistics
    const allReviews = reviews || [];
    const allBusinesses = businesses || [];
    const totalReviews = allReviews.length;
    const totalBusinesses = allBusinesses.length;

    const avgRating =
      totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const positiveCount = allReviews.filter(
      (r) => (r.sentiment || (r.rating >= 4 ? 'positive' : '')) === 'positive'
    ).length;

    const neutralCount = allReviews.filter(
      (r) => (r.sentiment || (r.rating === 3 ? 'neutral' : '')) === 'neutral'
    ).length;

    const negativeCount = allReviews.filter(
      (r) => (r.sentiment || (r.rating <= 2 ? 'negative' : '')) === 'negative'
    ).length;

    return NextResponse.json({
      success: true,
      businesses: allBusinesses,
      reviews: allReviews,
      profiles: profiles || [],
      stats: {
        totalBusinesses,
        totalReviews,
        averageRating: Number(avgRating.toFixed(1)),
        positivePercent: totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0,
        neutralPercent: totalReviews > 0 ? Math.round((neutralCount / totalReviews) * 100) : 0,
        negativePercent: totalReviews > 0 ? Math.round((negativeCount / totalReviews) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('Admin GET error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing type or id parameter.' },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    if (type === 'review') {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Review deleted successfully.' });
    }

    if (type === 'business') {
      const { error } = await supabase.from('businesses').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Business deleted successfully.' });
    }

    return NextResponse.json({ error: 'Invalid deletion type.' }, { status: 400 });
  } catch (err) {
    console.error('Admin DELETE error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete record.' },
      { status: 500 }
    );
  }
}
