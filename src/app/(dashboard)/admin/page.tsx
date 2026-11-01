'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';
import type { Business, Review } from '@/lib/types';
import {
  ShieldAlert,
  Building,
  MessageSquare,
  Star,
  ThumbsUp,
  Search,
  Trash2,
  ExternalLink,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Server,
  Layers,
} from 'lucide-react';

interface ExtendedReview extends Review {
  business_name?: string;
  business_slug?: string;
}

interface AdminData {
  businesses: Business[];
  reviews: ExtendedReview[];
  stats: {
    totalBusinesses: number;
    totalReviews: number;
    averageRating: number;
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'businesses' | 'reviews' | 'system'>('businesses');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'review' | 'business'; id: string; name: string } | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/data');
      if (res.status === 401) {
        router.push('/login?error=Admin%20access%20required');
        return;
      }
      const json = await res.json();
      if (json.success) {
        // Map business names to reviews
        const bizMap = new Map(json.businesses.map((b: Business) => [b.id, b]));
        const enrichedReviews = (json.reviews || []).map((r: Review) => {
          const biz = bizMap.get(r.business_id);
          return {
            ...r,
            business_name: biz ? biz.name : 'Unknown Business',
            business_slug: biz ? biz.slug : '',
          };
        });

        setData({
          businesses: json.businesses || [],
          reviews: enrichedReviews,
          stats: json.stats,
        });
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const handleAdminLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);

    try {
      const res = await fetch(`/api/admin/data?type=${confirmDelete.type}&id=${confirmDelete.id}`, {
        method: 'DELETE',
      });
      const resJson = await res.json();

      if (resJson.success) {
        if (confirmDelete.type === 'review') {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  reviews: prev.reviews.filter((r) => r.id !== confirmDelete.id),
                  stats: { ...prev.stats, totalReviews: Math.max(0, prev.stats.totalReviews - 1) },
                }
              : null
          );
        } else {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  businesses: prev.businesses.filter((b) => b.id !== confirmDelete.id),
                  stats: { ...prev.stats, totalBusinesses: Math.max(0, prev.stats.totalBusinesses - 1) },
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  // Filtered lists
  const filteredBusinesses = useMemo(() => {
    if (!data?.businesses) return [];
    if (!searchTerm) return data.businesses;
    const term = searchTerm.toLowerCase();
    return data.businesses.filter(
      (b) => b.name.toLowerCase().includes(term) || b.slug.toLowerCase().includes(term)
    );
  }, [data?.businesses, searchTerm]);

  const filteredReviews = useMemo(() => {
    if (!data?.reviews) return [];
    return data.reviews.filter((r) => {
      if (sentimentFilter !== 'all') {
        const effSentiment = r.sentiment || (r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative');
        if (effSentiment !== sentimentFilter) return false;
      }
      if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nameMatch = r.customer_name?.toLowerCase().includes(term);
        const commentMatch = r.comment.toLowerCase().includes(term);
        const bizMatch = r.business_name?.toLowerCase().includes(term);
        if (!nameMatch && !commentMatch && !bizMatch) return false;
      }
      return true;
    });
  }, [data?.reviews, searchTerm, sentimentFilter, ratingFilter]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
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
    <div className="space-y-8 max-w-6xl">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Super Admin Mode
            </span>
            <span className="text-xs text-slate-400">FeedBack@360</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="h-7 w-7 text-indigo-400" />
            Platform Control Center
          </h2>
          <p className="text-sm text-slate-300">
            Global governance over all businesses, reviews, and system health across Feedback360.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh Data
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleAdminLogout}
            className="gap-1.5 shadow-md"
          >
            <LogOut className="h-4 w-4" />
            Exit Admin
          </Button>
        </div>
      </div>

      {/* Global KPI Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-indigo-600">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Registered Businesses
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-gray-900">
                {data.stats.totalBusinesses}
              </span>
              <Building className="h-6 w-6 text-indigo-600" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Active customer review portals</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-blue-600">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Global Reviews
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-gray-900">
                {data.stats.totalReviews}
              </span>
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Submitted across platform</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-500">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Platform Avg Rating
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-gray-900">
                {data.stats.averageRating} ★
              </span>
              <Star className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Out of 5.0 maximum</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-600">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Positive Sentiment
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600">
                {data.stats.positivePercent}%
              </span>
              <ThumbsUp className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {data.stats.neutralPercent}% neutral, {data.stats.negativePercent}% negative
            </p>
          </Card>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('businesses')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'businesses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building className="h-4 w-4" />
          Businesses Directory ({data?.businesses.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Global Reviews Feed ({data?.reviews.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'system'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Server className="h-4 w-4" />
          System & AI Engine
        </button>
      </div>

      {/* TAB 1: ALL BUSINESSES */}
      {activeTab === 'businesses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search businesses by name or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              Showing {filteredBusinesses.length} of {data?.businesses.length} businesses
            </p>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Business Name</th>
                    <th className="px-5 py-3.5">Slug / Public URL</th>
                    <th className="px-5 py-3.5">Industry</th>
                    <th className="px-5 py-3.5">Created</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBusinesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {biz.name}
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={`/r/${biz.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          /r/{biz.slug}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {biz.industry || 'General'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {formatDate(biz.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setConfirmDelete({
                              type: 'business',
                              id: biz.id,
                              name: biz.name,
                            })
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredBusinesses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                        No businesses found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: GLOBAL REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews, customer, or business..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              <div>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <div className="divide-y divide-gray-100">
              {filteredReviews.map((rev) => (
                <div key={rev.id} className="p-5 flex items-start justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {rev.customer_name || 'Anonymous Customer'}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {rev.business_name}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{formatDate(rev.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= rev.rating ? 'fill-current' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <Badge
                        variant={
                          rev.sentiment === 'positive'
                            ? 'success'
                            : rev.sentiment === 'negative'
                            ? 'danger'
                            : 'warning'
                        }
                        className="text-[10px] capitalize px-1.5 py-0"
                      >
                        {rev.sentiment || (rev.rating >= 4 ? 'positive' : rev.rating === 3 ? 'neutral' : 'negative')}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed pt-1">
                      {rev.comment}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setConfirmDelete({
                        type: 'review',
                        id: rev.id,
                        name: `Review by ${rev.customer_name || 'Anonymous'} (${rev.rating}★)`,
                      })
                    }
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {filteredReviews.length === 0 && (
                <div className="p-10 text-center text-sm text-gray-400">
                  No reviews match your filters.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: SYSTEM & AI ENGINE */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-600" />
                <CardTitle>AI Provider Engine</CardTitle>
              </div>
              <CardDescription>
                Server-side natural language processing configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Active Provider</span>
                <span className="font-semibold text-gray-900 uppercase">Google Gemini</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Model Name</span>
                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  gemini-1.5-flash
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Classification Fallback</span>
                <span className="text-emerald-700 font-medium">Automatic Rule-Based</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Key Status</span>
                <Badge variant="success">Configured</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                <CardTitle>Database & Security</CardTitle>
              </div>
              <CardDescription>
                PostgreSQL cloud storage and Row Level Security status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Database Engine</span>
                <span className="font-semibold text-gray-900">Supabase PostgreSQL</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Row Level Security</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Super Admin Account</span>
                <span className="font-mono text-xs text-gray-800">FeedBack@360</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Super Admin Session</span>
                <Badge variant="info">Active Session</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Delete {confirmDelete.type === 'review' ? 'Review' : 'Business'}?
              </h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-gray-800">{confirmDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(null)}
                disabled={!!deletingId}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={!!deletingId}
                onClick={executeDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
