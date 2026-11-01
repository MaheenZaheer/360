import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeReviews, isAIConfigured } from '@/lib/ai/provider';
import type { Review } from '@/lib/types';

export async function GET() {
  const configured = isAIConfigured();
  const provider = process.env.AI_PROVIDER || null;

  return NextResponse.json({
    configured,
    provider: configured ? provider : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { business_id } = body;

    if (!business_id) {
      return NextResponse.json(
        { error: 'Missing business_id parameter.' },
        { status: 400 }
      );
    }

    // 2. Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', business_id)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied.' },
        { status: 404 }
      );
    }

    // 3. Check AI configuration
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          configured: false,
          error:
            'AI analysis is not configured on this server. Set AI_PROVIDER (e.g. openai, anthropic, or google) and AI_API_KEY in your environment variables.',
        },
        { status: 503 }
      );
    }

    // 4. Fetch recent reviews for analysis (up to 50 for depth & token efficiency)
    const { data: reviews, error: revError } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', business_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (revError) {
      return NextResponse.json(
        { error: 'Failed to fetch reviews for analysis.' },
        { status: 500 }
      );
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        {
          error:
            'No reviews found for this business. Collect some reviews first before running AI analysis.',
        },
        { status: 400 }
      );
    }

    // 5. Run AI analysis
    const analysisResponse = await analyzeReviews(reviews as Review[]);

    if (!analysisResponse.success || !analysisResponse.data) {
      return NextResponse.json(
        {
          error: analysisResponse.error || 'AI analysis failed to process reviews.',
          configured: analysisResponse.configured,
        },
        { status: 500 }
      );
    }

    // 6. Save analysis to Supabase
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('analysis_results')
      .insert({
        business_id,
        analysis_type: 'full',
        result: analysisResponse.data,
        review_count: reviews.length,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis to database:', saveError);
      // Still return the generated analysis to the user
      return NextResponse.json({
        success: true,
        data: analysisResponse.data,
        review_count: reviews.length,
        saved: false,
      });
    }

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
      data: savedAnalysis.result,
      review_count: reviews.length,
      saved: true,
    });
  } catch (err) {
    console.error('Analysis API route error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error.' },
      { status: 500 }
    );
  }
}
