'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getTemplate } from '@/lib/templates';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  businessId: string;
  businessName: string;
  templateId?: string | null;
}

export function ReviewForm({ businessId, businessName, templateId }: ReviewFormProps) {
  const template = getTemplate(templateId);
  const styles = template.styles;

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please choose a star rating (1 to 5 stars).');
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setError('Please provide feedback with at least 5 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          customer_name: customerName.trim() || undefined,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-10 px-4 space-y-4">
        <div
          className={cn(
            'h-16 w-16 mx-auto rounded-full flex items-center justify-center',
            styles.successIconWrapper
          )}
        >
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h3 className={cn('text-2xl font-bold tracking-tight', styles.successTitle)}>
          Thank you for your feedback!
        </h3>
        <p className={cn('max-w-md mx-auto text-sm leading-relaxed', styles.successDesc)}>
          Your review has been successfully submitted to{' '}
          <span className="font-semibold">{businessName}</span>. Your thoughts help us
          continually improve our service!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Star rating picker */}
      <div className="space-y-2 text-center py-2">
        <label className={cn('block text-sm font-semibold', styles.ratingLabel)}>
          How would you rate your experience? *
        </label>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating || rating) >= star;
            return (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1.5 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    isFilled ? styles.starActive : styles.starInactive
                  )}
                />
              </button>
            );
          })}
        </div>
        <p className="text-xs opacity-70">
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Average'}
          {rating === 4 && 'Good'}
          {rating === 5 && 'Excellent!'}
          {rating === 0 && 'Select a rating from 1 to 5'}
        </p>
      </div>

      {/* Name Input */}
      <div>
        <label
          htmlFor="customerName"
          className={cn('block text-sm font-medium mb-1.5', styles.inputLabel)}
        >
          Your Name (Optional)
        </label>
        <input
          id="customerName"
          type="text"
          placeholder="e.g. Alex Johnson"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-colors',
            styles.inputClass
          )}
        />
      </div>

      {/* Comment Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="comment"
          className={cn('block text-sm font-medium', styles.inputLabel)}
        >
          Your Feedback *
        </label>
        <textarea
          id="comment"
          rows={4}
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like? What could we improve? Tell us about your experience..."
          className={cn(
            'w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-colors leading-relaxed',
            styles.textareaClass
          )}
        />
        <div className="flex justify-between items-center text-xs opacity-60">
          <span>Minimum 5 characters</span>
          <span>{comment.length} characters</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          'w-full py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-lg',
          styles.buttonClass
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Feedback'
        )}
      </button>
    </form>
  );
}
