'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface RatingDataPoint {
  rating: string;
  count: number;
  [key: string]: string | number;
}

interface RatingChartProps {
  data: RatingDataPoint[];
}

export function RatingChart({ data }: RatingChartProps) {
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Rating Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {totalCount === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400">
            <p className="text-sm">No ratings recorded yet</p>
          </div>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="rating"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  stroke="#475569"
                  fontSize={12}
                  fontWeight={500}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as RatingDataPoint;
                      return (
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-md text-xs space-y-1">
                          <p className="font-semibold text-gray-800">{item.rating}</p>
                          <p className="text-indigo-600 font-medium">{item.count} reviews</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.map((_, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={
                        index === 0
                          ? '#10b981' // 5-star
                          : index === 1
                          ? '#34d399' // 4-star
                          : index === 2
                          ? '#f59e0b' // 3-star
                          : index === 3
                          ? '#fb923c' // 2-star
                          : '#ef4444' // 1-star
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
