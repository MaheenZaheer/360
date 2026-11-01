'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useBusiness } from '@/lib/hooks/use-business';
import { createClient } from '@/lib/supabase/client';
import type { Review, AnalysisData } from '@/lib/types';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ReviewItem } from '@/components/dashboard/review-item';
import { SentimentChart } from '@/components/charts/sentiment-chart';
import { TrendChart } from '@/components/charts/trend-chart';
import { RatingChart } from '@/components/charts/rating-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/loading';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  TrendingUp,
  PlusCircle,
  Sparkles,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { business } = useBusiness();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!business?.id) return;

    try {
      const supabase = createClient();

      // 1. Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      } else {
        setReviews(reviewsData || []);
      }

      // 2. Fetch latest AI analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysisError) {
        console.error('Error fetching analysis:', analysisError);
      } else if (analysisData?.result) {
        setLatestAnalysis(analysisData.result as AnalysisData);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [business]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Compute metrics from real reviews
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;

  reviews.forEach((r) => {
    const s = r.sentiment || (r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative');
    if (s === 'positive') positiveCount++;
    else if (s === 'neutral') neutralCount++;
    else if (s === 'negative') negativeCount++;
  });

  const positivePercent = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;
  const neutralPercent = totalReviews > 0 ? Math.round((neutralCount / totalReviews) * 100) : 0;
  const negativePercent = totalReviews > 0 ? Math.round((negativeCount / totalReviews) * 100) : 0;

  // Sentiment chart data
  const sentimentDistribution = [
    { name: 'Positive', value: positiveCount, color: '#10b981' },
    { name: 'Neutral', value: neutralCount, color: '#f59e0b' },
    { name: 'Negative', value: negativeCount, color: '#ef4444' },
  ];

  // Rating distribution data (5 stars down to 1 star)
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    rating: `${star} ★`,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  // Trends over last 14 days
  const days = 14;
  const trendMap: { [key: string]: { count: number; sumRating: number } } = {};
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    trendMap[dateKey] = { count: 0, sumRating: 0 };
  }

  reviews.forEach((r) => {
    const reviewDate = new Date(r.created_at);
    const diffDays = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays < days && diffDays >= 0) {
      const dateKey = reviewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (trendMap[dateKey]) {
        trendMap[dateKey].count += 1;
        trendMap[dateKey].sumRating += r.rating;
      }
    }
  });

  const reviewTrends = Object.keys(trendMap).map((date) => ({
    date,
    count: trendMap[date].count,
    avgRating: trendMap[date].count > 0 ? trendMap[date].sumRating / trendMap[date].count : 0,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {business.name} Overview
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time customer feedback analytics and AI insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
            Refresh
          </Button>
          <Link href="/collect">
            <Button size="sm" className="flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              Collect Reviews
            </Button>
          </Link>
        </div>
      </div>

      {totalReviews === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={MessageSquare}
            title="No reviews received yet"
            description="Start collecting customer reviews using your unique public review link or QR code."
            action={
              <Link href="/collect">
                <Button className="mt-2 flex items-center gap-2">
                  Get Your Review Link
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Reviews"
              value={totalReviews}
              subtitle="All-time customer feedback"
              icon={MessageSquare}
            />
            <KPICard
              title="Average Rating"
              value={averageRating.toFixed(1)}
              subtitle={`${reviews.filter((r) => r.rating === 5).length} five-star ratings`}
              icon={Star}
            />
            <KPICard
              title="Positive Sentiment"
              value={`${positivePercent}%`}
              subtitle={`${positiveCount} positive responses`}
              icon={ThumbsUp}
              trend={{
                value: positivePercent,
                positive: positivePercent >= 60,
              }}
            />
            <KPICard
              title="Satisfaction Index"
              value={
                positivePercent >= 70
                  ? 'High'
                  : positivePercent >= 40
                  ? 'Moderate'
                  : 'Needs Attention'
              }
              subtitle={`${neutralPercent}% neutral, ${negativePercent}% negative`}
              icon={TrendingUp}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TrendChart data={reviewTrends} />
            </div>
            <div>
              <SentimentChart
                data={sentimentDistribution}
                totalReviews={totalReviews}
              />
            </div>
          </div>

          {/* Rating Breakdown & AI Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <RatingChart data={ratingDistribution} />
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <CardTitle>AI Key Insights & Recommendations</CardTitle>
                  </div>
                  <Link
                    href="/analysis"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Deep Dive
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  {latestAnalysis ? (
                    <div className="space-y-4">
                      {latestAnalysis.summary && (
                        <p className="text-sm text-gray-700 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100/80 leading-relaxed">
                          {latestAnalysis.summary}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {latestAnalysis.key_concerns && latestAnalysis.key_concerns.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Key Concerns
                            </h4>
                            <ul className="text-xs text-gray-600 space-y-1.5 pl-1">
                              {latestAnalysis.key_concerns.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-red-500 font-bold">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {latestAnalysis.recommendations && latestAnalysis.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              Action Items
                            </h4>
                            <ul className="text-xs text-gray-600 space-y-1.5 pl-1">
                              {latestAnalysis.recommendations.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-3">
                      <div className="h-10 w-10 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-gray-600 max-w-sm mx-auto">
                        Unlock sentiment trends, common complaints, and actionable recommendations with AI.
                      </p>
                      <Link href="/analysis">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          Run AI Analysis
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Reviews Table/List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Reviews</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Latest customer submissions and feedback
                </p>
              </div>
              <Link
                href="/reviews"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all ({totalReviews})
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {reviews.slice(0, 5).map((review) => (
                  <ReviewItem key={review.id} review={review} compact />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
