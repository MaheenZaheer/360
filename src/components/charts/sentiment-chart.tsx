'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SentimentDataPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface SentimentChartProps {
  data: SentimentDataPoint[];
  totalReviews: number;
}

export function SentimentChart({ data, totalReviews }: SentimentChartProps) {
  const hasData = totalReviews > 0 && data.some((d) => d.value > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Sentiment Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400">
            <p className="text-sm">No review sentiment data available yet</p>
          </div>
        ) : (
          <div className="w-full h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as SentimentDataPoint;
                      const numVal = Number(item.value) || 0;
                      const pct = totalReviews > 0 ? ((numVal / totalReviews) * 100).toFixed(1) : '0';
                      return (
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-md text-xs space-y-1">
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-gray-600 font-medium">
                            {numVal} reviews ({pct}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs font-medium text-gray-700">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
