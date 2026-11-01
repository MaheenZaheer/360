'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TrendDataPoint {
  date: string;
  count: number;
  avgRating: number;
  [key: string]: string | number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  const hasData = data && data.length > 0 && data.some((d) => d.count > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Review Trends</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400">
            <p className="text-sm">No trend data available for this timeframe</p>
          </div>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as TrendDataPoint;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-md text-xs space-y-1">
                          <p className="font-semibold text-gray-800">{label}</p>
                          <p className="text-indigo-600">
                            Reviews: <span className="font-bold">{item.count}</span>
                          </p>
                          {item.avgRating > 0 && (
                            <p className="text-amber-600">
                              Avg Rating: <span className="font-bold">{item.avgRating.toFixed(1)} ★</span>
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
