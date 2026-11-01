'use client';

import React from 'react';
import type { Review } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { timeAgo } from '@/lib/utils';
import { Star, User } from 'lucide-react';

interface ReviewItemProps {
  review: Review;
  compact?: boolean;
}

export function ReviewItem({ review, compact = false }: ReviewItemProps) {
  const getBadgeVariant = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'danger';
      case 'neutral':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              {review.customer_name || 'Anonymous Customer'}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
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
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">
                {timeAgo(review.created_at)}
              </span>
            </div>
          </div>
        </div>

        {review.sentiment && (
          <Badge
            variant={getBadgeVariant(review.sentiment)}
            className="capitalize shrink-0"
          >
            {review.sentiment}
          </Badge>
        )}
      </div>

      <p
        className={`mt-2.5 text-sm text-gray-600 leading-relaxed ${
          compact ? 'line-clamp-2' : ''
        }`}
      >
        {review.comment}
      </p>
    </div>
  );
}
