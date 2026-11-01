'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBusiness } from '@/lib/hooks/use-business';
import { createClient } from '@/lib/supabase/client';
import type { Review } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/loading';
import { exportToCSV, formatDate } from '@/lib/utils';
import {
  MessageSquare,
  Search,
  Download,
  Star,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

export default function ReviewsPage() {
  const { business } = useBusiness();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Pagination / Load more
  const [displayCount, setDisplayCount] = useState(15);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!business?.id) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
      } else {
        setReviews(data || []);
      }
    } catch (err) {
      console.error('Reviews load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  // Filter & Sort Logic
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((review) => {
        // Sentiment filter
        if (sentimentFilter !== 'all') {
          const effectiveSentiment =
            review.sentiment ||
            (review.rating >= 4 ? 'positive' : review.rating === 3 ? 'neutral' : 'negative');
          if (effectiveSentiment !== sentimentFilter) return false;
        }

        // Rating filter
        if (ratingFilter !== 'all') {
          if (review.rating !== Number(ratingFilter)) return false;
        }

        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const nameMatch = review.customer_name?.toLowerCase().includes(term);
          const commentMatch = review.comment.toLowerCase().includes(term);
          if (!nameMatch && !commentMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'highest') {
          return b.rating - a.rating;
        }
        if (sortBy === 'lowest') {
          return a.rating - b.rating;
        }
        return 0;
      });
  }, [reviews, sentimentFilter, ratingFilter, searchTerm, sortBy]);

  const displayedReviews = filteredReviews.slice(0, displayCount);

  const handleExportCSV = () => {
    if (filteredReviews.length === 0) return;

    const dataToExport = filteredReviews.map((r) => ({
      ID: r.id,
      Date: formatDate(r.created_at),
      Customer: r.customer_name || 'Anonymous',
      Rating: r.rating,
      Sentiment: r.sentiment || (r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative'),
      Comment: r.comment,
    }));

    exportToCSV(dataToExport, `${business.slug || 'business'}-reviews-${new Date().toISOString().slice(0, 10)}`);
  };

  const getSentimentBadgeVariant = (sentiment: string | null, rating: number) => {
    const s = sentiment || (rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative');
    if (s === 'positive') return 'success';
    if (s === 'negative') return 'danger';
    return 'warning';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Reviews Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse, filter, search, and export feedback from your customers.
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
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredReviews.length === 0}
            className="flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export CSV ({filteredReviews.length})
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls Card */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search feedback or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Sentiment Filter */}
          <div>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive Only</option>
              <option value="neutral">Neutral Only</option>
              <option value="negative">Negative Only</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars (★★★★★)</option>
              <option value="4">4 Stars (★★★★☆)</option>
              <option value="3">3 Stars (★★★☆☆)</option>
              <option value="2">2 Stars (★★☆☆☆)</option>
              <option value="1">1 Star (★☆☆☆☆)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="highest">Sort: Highest Rating</option>
              <option value="lowest">Sort: Lowest Rating</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-semibold">
            Showing {filteredReviews.length} of {reviews.length} Reviews
          </CardTitle>
          {(searchTerm || sentimentFilter !== 'all' || ratingFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSentimentFilter('all');
                setRatingFilter('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Reset Filters
            </button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {filteredReviews.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={MessageSquare}
                title="No reviews match your filters"
                description={
                  reviews.length === 0
                    ? "You haven't received any customer feedback yet. Share your review link to get started!"
                    : "Try adjusting your search criteria or resetting filters to see results."
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayedReviews.map((review) => {
                const isExpanded = expandedId === review.id;
                const effectiveSentiment =
                  review.sentiment ||
                  (review.rating >= 4 ? 'positive' : review.rating === 3 ? 'neutral' : 'negative');

                return (
                  <div
                    key={review.id}
                    className="p-5 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">
                              {review.customer_name || 'Anonymous Customer'}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(review.created_at)}
                            </span>
                          </div>

                          {/* Stars */}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${
                                    star <= review.rating ? 'fill-current' : 'text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              {review.rating}.0
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Badge
                          variant={getSentimentBadgeVariant(review.sentiment, review.rating)}
                          className="capitalize text-xs font-medium"
                        >
                          {effectiveSentiment}
                        </Badge>
                      </div>
                    </div>

                    {/* Review Comment Content */}
                    <div className="mt-3 text-sm text-gray-700 pl-0 sm:pl-12">
                      <p className={`leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                        {review.comment}
                      </p>
                      {review.comment.length > 200 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : review.id)}
                          className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              Show less <ChevronUp className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              Read full review <ChevronDown className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {filteredReviews.length > displayCount && (
            <div className="p-4 border-t border-gray-100 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisplayCount((prev) => prev + 15)}
              >
                Load More Reviews ({filteredReviews.length - displayCount} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
