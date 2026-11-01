// ================================================
// Feedback360 Type Definitions
// ================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  review_template?: 'default' | 'warm' | 'dark' | 'vibrant' | 'minimal' | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  customer_name: string | null;
  rating: number;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  source: string;
  created_at: string;
}

export interface AnalysisResult {
  id: string;
  business_id: string;
  analysis_type: 'sentiment' | 'topics' | 'summary' | 'full';
  result: AnalysisData;
  review_count: number;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export interface AnalysisData {
  sentiment_summary?: {
    positive: number;
    neutral: number;
    negative: number;
    average_rating: number;
  };
  topics?: Array<{
    topic: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  key_concerns?: string[];
  strengths?: string[];
  recommendations?: string[];
  summary?: string;
}

export interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  reviewTrends: Array<{
    date: string;
    count: number;
    avgRating: number;
  }>;
  sentimentDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentReviews: Review[];
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  period: 'daily' | 'weekly' | 'monthly';
  sentiment?: 'positive' | 'neutral' | 'negative' | 'all';
}

export interface ReviewSubmission {
  business_id: string;
  customer_name?: string;
  rating: number;
  comment: string;
}

export type SentimentType = 'positive' | 'neutral' | 'negative';
