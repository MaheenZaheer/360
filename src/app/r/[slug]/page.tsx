import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ReviewForm } from '@/components/reviews/review-form';
import { getTemplate } from '@/lib/templates';
import { MessageSquareHeart, Globe, Utensils, Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Leave Feedback — Feedback360`,
    description: `Submit your feedback and review.`,
  };
}

export default async function PublicReviewPage({ params }: Props) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-xl border border-gray-200 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Configuration Required</h2>
          <p className="text-sm text-gray-500 mt-2">
            The application database connection is not configured yet. Please check environment variables.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Attempt to select with review_template first, fallback if column does not exist yet
  let business: {
    id: string;
    name: string;
    description: string | null;
    website: string | null;
    review_template?: string | null;
  } | null = null;

  try {
    const res = await supabase
      .from('businesses')
      .select('id, name, description, website, review_template')
      .eq('slug', slug)
      .maybeSingle();

    if (!res.error && res.data) {
      business = res.data;
    }
  } catch {
    // Ignore and fallback below
  }

  if (!business) {
    const fallbackRes = await supabase
      .from('businesses')
      .select('id, name, description, website')
      .eq('slug', slug)
      .maybeSingle();

    if (fallbackRes.error || !fallbackRes.data) {
      notFound();
    }
    business = fallbackRes.data;
  }

  // Determine template ID
  let templateId = business.review_template || 'default';
  let cleanDescription = business.description || '';

  // Check description for [template:xyz] fallback tag
  const templateTagMatch = cleanDescription.match(/\[template:([a-z]+)\]/i);
  if (templateTagMatch) {
    templateId = templateTagMatch[1];
    cleanDescription = cleanDescription.replace(/\[template:[a-z]+\]/gi, '').trim();
  }

  const template = getTemplate(templateId);
  const styles = template.styles;

  // Template icon
  const getHeaderIcon = () => {
    switch (template.id) {
      case 'warm':
        return <Utensils className="h-6 w-6" />;
      case 'dark':
        return <Sparkles className="h-6 w-6" />;
      case 'vibrant':
        return <HeartHandshake className="h-6 w-6" />;
      case 'minimal':
        return <ShieldCheck className="h-6 w-6" />;
      default:
        return <MessageSquareHeart className="h-6 w-6" />;
    }
  };

  return (
    <div className={cn('flex flex-col justify-between py-10 px-4 sm:px-6 transition-colors', styles.pageWrapper)}>
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Brand / Business Header Card */}
        <div className="text-center space-y-2 pt-2">
          <div
            className={cn(
              'inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-2 transition-transform hover:scale-105',
              styles.headerIconWrapper
            )}
          >
            {getHeaderIcon()}
          </div>
          <h1 className={cn('text-2xl sm:text-3xl font-extrabold tracking-tight', styles.titleClass)}>
            {business.name}
          </h1>
          {cleanDescription ? (
            <p className={cn('text-sm max-w-md mx-auto leading-relaxed', styles.descClass)}>
              {cleanDescription}
            </p>
          ) : (
            <p className={cn('text-sm max-w-md mx-auto', styles.descClass)}>
              {template.id === 'warm'
                ? 'Thank you for dining with us! Please share your experience.'
                : 'We value your feedback! Tell us about your experience to help us improve.'}
            </p>
          )}

          {business.website && (
            <div className="pt-1">
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('text-xs font-medium inline-flex items-center gap-1', styles.websiteLink)}
              >
                <Globe className="h-3 w-3" />
                {business.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Review Form Card */}
        <div className={styles.cardWrapper}>
          <ReviewForm
            businessId={business.id}
            businessName={business.name}
            templateId={template.id}
          />
        </div>
      </div>

      {/* Footer Branding */}
      <footer className={cn('text-center py-6 text-xs transition-colors', styles.footerClass)}>
        Powered by{' '}
        <span className="font-semibold opacity-90">Feedback360</span> —
        Customer Experience Intelligence
      </footer>
    </div>
  );
}
