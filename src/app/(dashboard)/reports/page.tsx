'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBusiness } from '@/lib/hooks/use-business';
import { createClient } from '@/lib/supabase/client';
import type { Review } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/loading';
import { exportToCSV, formatDate } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  Download,
  Star,
  RefreshCw,
  FileText,
} from 'lucide-react';

export default function ReportsPage() {
  const { business } = useBusiness();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

  const fetchReviews = useCallback(async () => {
    if (!business?.id) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Reports fetch error:', error);
      } else {
        setReviews(data || []);
      }
    } catch (err) {
      console.error('Reports fetch error:', err);
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

  // Preset Date Ranges
  const setRangePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  // Filter reviews by date range & sentiment
  const filteredReviews = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return reviews.filter((r) => {
      const reviewDate = new Date(r.created_at);
      if (reviewDate < start || reviewDate > end) return false;

      if (sentimentFilter !== 'all') {
        const effSentiment =
          r.sentiment ||
          (r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative');
        if (effSentiment !== sentimentFilter) return false;
      }

      return true;
    });
  }, [reviews, startDate, endDate, sentimentFilter]);

  // Metric Computations
  const totalInPeriod = filteredReviews.length;
  const avgRating =
    totalInPeriod > 0
      ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalInPeriod).toFixed(1)
      : '0.0';

  const positiveCount = filteredReviews.filter(
    (r) => (r.sentiment || (r.rating >= 4 ? 'positive' : '')) === 'positive'
  ).length;

  const neutralCount = filteredReviews.filter(
    (r) => (r.sentiment || (r.rating === 3 ? 'neutral' : '')) === 'neutral'
  ).length;

  const negativeCount = filteredReviews.filter(
    (r) => (r.sentiment || (r.rating <= 2 ? 'negative' : '')) === 'negative'
  ).length;

  // Aggregate by chosen period (daily, weekly, monthly)
  const chartData = useMemo(() => {
    const map: Record<
      string,
      { label: string; count: number; positive: number; neutral: number; negative: number; avgRatingSum: number }
    > = {};

    filteredReviews.forEach((r) => {
      const d = new Date(r.created_at);
      let key = '';
      let label = '';

      if (period === 'daily') {
        key = d.toISOString().slice(0, 10);
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (period === 'weekly') {
        // Group by beginning of week
        const firstDayOfWeek = new Date(d);
        firstDayOfWeek.setDate(d.getDate() - d.getDay());
        key = firstDayOfWeek.toISOString().slice(0, 10);
        label = `Wk of ${firstDayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      if (!map[key]) {
        map[key] = { label, count: 0, positive: 0, neutral: 0, negative: 0, avgRatingSum: 0 };
      }

      map[key].count += 1;
      map[key].avgRatingSum += r.rating;

      const s = r.sentiment || (r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative');
      if (s === 'positive') map[key].positive += 1;
      else if (s === 'neutral') map[key].neutral += 1;
      else if (s === 'negative') map[key].negative += 1;
    });

    return Object.keys(map)
      .sort()
      .map((k) => ({
        ...map[k],
        avgRating: map[k].count > 0 ? (map[k].avgRatingSum / map[k].count).toFixed(1) : 0,
      }));
  }, [filteredReviews, period]);

  // Export Report to CSV
  const handleExportCSV = () => {
    if (filteredReviews.length === 0) return;

    const data = filteredReviews.map((r) => ({
      ID: r.id,
      Date: formatDate(r.created_at),
      Customer: r.customer_name || 'Anonymous',
      Rating: r.rating,
      Sentiment: r.sentiment || (r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative'),
      Feedback: r.comment,
    }));

    exportToCSV(
      data,
      `${business.slug || 'business'}-report-${startDate}-to-${endDate}`
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Performance Reports
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Historical analytics, sentiment trends, and exportable reports.
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
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredReviews.length === 0}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV ({filteredReviews.length})
          </Button>
        </div>
      </div>

      {/* Date Range & Controls Card */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick preset buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Presets:
            </span>
            <button
              onClick={() => setRangePreset(7)}
              className="text-xs px-2.5 py-1 rounded bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setRangePreset(30)}
              className="text-xs px-2.5 py-1 rounded bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setRangePreset(90)}
              className="text-xs px-2.5 py-1 rounded bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-colors"
            >
              Last 90 Days
            </button>
          </div>

          {/* Date Pickers */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-xs font-medium text-gray-600">
                From:
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-xs font-medium text-gray-600">
                To:
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Sentiment Filter */}
            <div>
              <select
                aria-label="Filter by sentiment"
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value as 'all' | 'positive' | 'neutral' | 'negative')}
                className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive Only</option>
                <option value="neutral">Neutral Only</option>
                <option value="negative">Negative Only</option>
              </select>
            </div>

            {/* Aggregation Period */}
            <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                    period === p
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Summary KPI Cards in Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Period Volume
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-gray-900">
              {totalInPeriod}
            </span>
            <FileText className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Customer reviews submitted</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Average Rating
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-gray-900">
              {avgRating} ★
            </span>
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Out of 5.0 maximum</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Positive Reviews
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-emerald-600">
              {positiveCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {totalInPeriod > 0 ? Math.round((positiveCount / totalInPeriod) * 100) : 0}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Satisfied customers</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Critical Reviews
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-red-600">
              {negativeCount}
            </span>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
              {totalInPeriod > 0 ? Math.round((negativeCount / totalInPeriod) * 100) : 0}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{neutralCount} neutral, {negativeCount} critical</p>
        </Card>
      </div>

      {/* Review Volume Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Review Volume Trend ({period})</CardTitle>
          <CardDescription>
            Total reviews received over time broken down by period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center text-gray-400">
              <p className="text-sm">No review volume recorded in this date range.</p>
            </div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      borderColor: '#e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Reviews" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sentiment Breakdown Over Time (Stacked Area Chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Evolution</CardTitle>
          <CardDescription>
            Positive, neutral, and negative feedback trends over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center text-gray-400">
              <p className="text-sm">No sentiment data available for this range.</p>
            </div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      borderColor: '#e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-gray-600 font-medium">{val}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="positive"
                    name="Positive"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.7}
                  />
                  <Area
                    type="monotone"
                    dataKey="neutral"
                    name="Neutral"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.7}
                  />
                  <Area
                    type="monotone"
                    dataKey="negative"
                    name="Negative"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.7}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
