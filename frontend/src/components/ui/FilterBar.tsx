import React from 'react';
import { FilterIcon, XIcon } from 'lucide-react';
import { Button } from './Button';
type FilterBarProps = {
  children: React.ReactNode;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
};
export function FilterBar({
  children,
  onClear,
  hasActiveFilters = false,
  className = ''
}: FilterBarProps) {
  return <div className={`bg-white border border-gray-200 rounded-xl p-3 sm:p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FilterIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Filtrat</span>
        </div>
        <div className="flex-1 flex flex-wrap gap-3">{children}</div>
        {hasActiveFilters && onClear && <Button variant="ghost" size="sm" onClick={onClear} icon={<XIcon className="w-4 h-4" />} className="self-start sm:self-auto">
            Pastro
          </Button>}
      </div>
    </div>;
}