import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { classifySentiment } from '@/lib/ai/provider';
import type { Review } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_id, customer_name, rating, comment } = body;

    // 1. Validation
    if (!business_id || typeof business_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid business_id.' },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5.' },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return NextResponse.json(
        { error: 'Comment must be at least 3 characters.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database environment variables are not configured.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Verify business exists
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Associated business not found.' },
        { status: 404 }
      );
    }

    // 3. Classify sentiment
    const dummyReview: Review = {
      id: '',
      business_id,
      customer_name: customer_name || null,
      rating: numRating,
      comment: comment.trim(),
      sentiment: null,
      source: 'link',
      created_at: new Date().toISOString(),
    };

    const { sentiment } = await classifySentiment(dummyReview);

    // 4. Save review to Supabase with explicit UUID
    const reviewId = crypto.randomUUID();
    const computedSentiment =
      sentiment ||
      (numRating >= 4 ? 'positive' : numRating === 3 ? 'neutral' : 'negative');

    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        id: reviewId,
        business_id,
        customer_name: customer_name?.trim() || null,
        rating: numRating,
        comment: comment.trim(),
        sentiment: computedSentiment,
        source: 'link',
      });

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return NextResponse.json(
        { error: insertError.message || 'Failed to save review in database.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        review: {
          id: reviewId,
          business_id,
          customer_name: customer_name?.trim() || null,
          rating: numRating,
          comment: comment.trim(),
          sentiment: computedSentiment,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API /api/reviews error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error.' },
      { status: 500 }
    );
  }
}
