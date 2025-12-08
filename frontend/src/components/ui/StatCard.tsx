import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUpIcon, TrendingDownIcon, ArrowRightIcon } from 'lucide-react';
import { Card } from './Card';
type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  link?: string;
  loading?: boolean;
};
export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  link,
  loading = false
}: StatCardProps) {
  const content = <Card hover={!!link} className="h-full">
      {loading ? <div className="space-y-3 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div> : <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <p className="text-xs sm:text-sm font-medium text-gray-500 line-clamp-2">
              {title}
            </p>
            <div className="p-2 sm:p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
              {icon}
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            {value}
          </p>
          {change && <div className="flex items-center justify-between">
              <p className={`text-xs sm:text-sm flex items-center gap-1 ${changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
                {changeType === 'positive' && <TrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
                {changeType === 'negative' && <TrendingDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="truncate">{change}</span>
              </p>
              {link && <ArrowRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </div>}
        </div>}
    </Card>;
  if (link) {
    return <Link to={link} className="block">
        {content}
      </Link>;
  }
  return content;
}