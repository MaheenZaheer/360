'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBusiness } from '@/lib/hooks/use-business';
import { createClient } from '@/lib/supabase/client';
import type { AnalysisResult, AnalysisData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/loading';
import { formatDateTime } from '@/lib/utils';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  Tag,
  ArrowRight,
  Clock,
  History,
} from 'lucide-react';

export default function AnalysisPage() {
  const { business } = useBusiness();
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [analysisMeta, setAnalysisMeta] = useState<{
    createdAt: string;
    reviewCount: number;
  } | null>(null);
  const [pastAnalyses, setPastAnalyses] = useState<AnalysisResult[]>([]);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(0);

  // 1. Check AI configuration and load existing analyses
  useEffect(() => {
    async function init() {
      if (!business?.id) return;
      try {
        // Check configuration via GET /api/analyze
        const configRes = await fetch('/api/analyze');
        const configData = await configRes.json();
        setIsConfigured(configData.configured);
        setProviderName(configData.provider);

        const supabase = createClient();

        // Check review count
        const { count } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', business.id);

        setTotalReviewsCount(count || 0);

        // Fetch past analysis results
        const { data: analyses, error: anError } = await supabase
          .from('analysis_results')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false });

        if (anError) {
          console.error('Error fetching past analyses:', anError);
        } else if (analyses && analyses.length > 0) {
          setPastAnalyses(analyses as AnalysisResult[]);
          setCurrentAnalysis(analyses[0].result as AnalysisData);
          setAnalysisMeta({
            createdAt: analyses[0].created_at,
            reviewCount: analyses[0].review_count,
          });
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [business?.id]);

  // 2. Trigger new AI analysis
  const handleRunAnalysis = async () => {
    if (!business?.id) return;
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: business.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete AI analysis.');
      }

      if (data.analysis) {
        setCurrentAnalysis(data.analysis.result);
        setAnalysisMeta({
          createdAt: data.analysis.created_at,
          reviewCount: data.analysis.review_count,
        });
        setPastAnalyses((prev) => [data.analysis, ...prev]);
      } else if (data.data) {
        setCurrentAnalysis(data.data);
        setAnalysisMeta({
          createdAt: new Date().toISOString(),
          reviewCount: data.review_count,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getTopicBadgeVariant = (sentiment: string) => {
    if (sentiment === 'positive') return 'success';
    if (sentiment === 'negative') return 'danger';
    return 'warning';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Brain className="h-6 w-6 text-indigo-600" />
            AI Review Intelligence
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Natural language analysis extracting sentiment, topics, recurring complaints, and actionable advice.
          </p>
        </div>

        {isConfigured && (
          <Button
            onClick={handleRunAnalysis}
            loading={analyzing}
            disabled={totalReviewsCount === 0}
            className="flex items-center gap-2 shrink-0 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            {currentAnalysis ? 'Re-Analyze Reviews' : 'Run AI Analysis'}
          </Button>
        )}
      </div>

      {/* Missing AI Configuration Notice */}
      {isConfigured === false && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  AI Provider Not Configured
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Feedback360 uses real server-side AI for authentic customer sentiment and topic analysis. We do not generate mock or synthetic analysis data. To enable full AI intelligence, configure your API credentials in <code className="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-mono">.env.local</code>.
                </p>

                <div className="bg-white p-4 rounded-lg border border-amber-200 text-xs font-mono text-gray-800 space-y-1">
                  <p className="text-gray-500"># Choose one provider: openai, anthropic, or google</p>
                  <p><span className="text-indigo-600 font-semibold">AI_PROVIDER</span>=openai</p>
                  <p><span className="text-indigo-600 font-semibold">AI_API_KEY</span>=sk-proj-your-api-key-here</p>
                  <p><span className="text-indigo-600 font-semibold">AI_MODEL</span>=gpt-4o-mini <span className="text-gray-400"># Optional</span></p>
                </div>

                <p className="text-xs text-gray-600">
                  Supported providers: <strong>OpenAI</strong> (e.g. gpt-4o-mini), <strong>Anthropic</strong> (e.g. claude-3-haiku), or <strong>Google Gemini</strong> (e.g. gemini-1.5-flash).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* If 0 reviews exist */}
      {totalReviewsCount === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={Brain}
            title="No reviews available for analysis"
            description="Collect customer reviews first. Once reviews are submitted, AI can analyze sentiment patterns, highlight issues, and provide recommendations."
            action={
              <Link href="/collect">
                <Button className="mt-2 flex items-center gap-2">
                  Collect Reviews
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />
        </Card>
      ) : isConfigured && !currentAnalysis && !analyzing ? (
        /* Has reviews, but hasn't run analysis yet */
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Ready to Analyze {totalReviewsCount} Customer Reviews
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Using your configured AI provider ({providerName || 'AI Engine'}), Feedback360 will process all review texts to extract key topics, recurring complaints, and actionable improvement steps.
            </p>
            <Button
              onClick={handleRunAnalysis}
              className="flex items-center gap-2 mx-auto"
            >
              <Sparkles className="h-4 w-4" />
              Generate First Analysis
            </Button>
          </div>
        </Card>
      ) : analyzing ? (
        /* Analyzing State */
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto animate-pulse">
              <Brain className="h-7 w-7 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              AI is Analyzing Reviews...
            </h3>
            <p className="text-sm text-gray-500">
              Reading through customer feedback, classifying sentiments, identifying pain points, and synthesizing recommendations. This typically takes 3-6 seconds.
            </p>
          </div>
        </Card>
      ) : currentAnalysis ? (
        /* Display Active Analysis Results */
        <div className="space-y-6">
          {/* Analysis Meta Banner */}
          {analysisMeta && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span>
                  Generated on {formatDateTime(analysisMeta.createdAt)}
                </span>
                <span>•</span>
                <span>Analyzed {analysisMeta.reviewCount} customer reviews</span>
              </div>
              <span className="font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Latest Insights
              </span>
            </div>
          )}

          {/* Executive Summary Card */}
          {currentAnalysis.summary && (
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-white">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-base">Executive Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 leading-relaxed text-sm font-medium">
                  {currentAnalysis.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Topics & Sentiment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mentioned Topics */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-base">Frequently Mentioned Topics</CardTitle>
                </div>
                <CardDescription>
                  Common subjects and themes customers talk about
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAnalysis.topics && currentAnalysis.topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentAnalysis.topics.map((t, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50/50 text-xs"
                      >
                        <span className="font-semibold text-gray-800 capitalize">
                          {t.topic}
                        </span>
                        <span className="text-gray-400 font-mono">
                          ({t.count})
                        </span>
                        <Badge
                          variant={getTopicBadgeVariant(t.sentiment)}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {t.sentiment}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No specific topics extracted.</p>
                )}
              </CardContent>
            </Card>

            {/* Strengths & Delights */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base">What Customers Love</CardTitle>
                </div>
                <CardDescription>
                  Key positive highlights mentioned by satisfied reviewers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAnalysis.strengths && currentAnalysis.strengths.length > 0 ? (
                  <ul className="space-y-2.5">
                    {currentAnalysis.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No positive highlights identified yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Concerns and Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Customer Concerns */}
            <Card className="border-red-100">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-base text-red-950">
                    Recurring Complaints & Concerns
                  </CardTitle>
                </div>
                <CardDescription>
                  Issues flagged in negative or critical customer feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAnalysis.key_concerns && currentAnalysis.key_concerns.length > 0 ? (
                  <ul className="space-y-2.5">
                    {currentAnalysis.key_concerns.map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{concern}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No recurring complaints identified.</p>
                )}
              </CardContent>
            </Card>

            {/* Actionable Recommendations */}
            <Card className="border-indigo-100">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-base text-indigo-950">
                    Actionable Recommendations
                  </CardTitle>
                </div>
                <CardDescription>
                  Strategic steps to resolve friction and boost customer satisfaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAnalysis.recommendations && currentAnalysis.recommendations.length > 0 ? (
                  <ul className="space-y-2.5">
                    {currentAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                        <div className="h-4 w-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No recommendations available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Past Analyses History */}
          {pastAnalyses.length > 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-base">Analysis History</CardTitle>
                </div>
                <CardDescription>
                  Review previous snapshots of your customer sentiment trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-100">
                  {pastAnalyses.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-gray-800">
                          Analysis on {formatDateTime(item.created_at)}
                        </p>
                        <p className="text-gray-500">
                          {item.review_count} reviews analyzed
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCurrentAnalysis(item.result as AnalysisData);
                          setAnalysisMeta({
                            createdAt: item.created_at,
                            reviewCount: item.review_count,
                          });
                        }}
                      >
                        View Snapshot
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
