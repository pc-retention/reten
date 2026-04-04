import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
}

export default function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600'
      : trend?.direction === 'down'
        ? 'text-red-600'
        : 'text-gray-500';

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
        ? TrendingDown
        : Minus;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-sm ${trendColor}`}>
              <TrendIcon size={16} />
              <span className="font-medium">{trend.percentage}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0 p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
