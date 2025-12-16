import React, { useMemo, useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, item: T, index: number) => React.ReactNode;
  hideOnMobile?: boolean;
};
type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  pagination?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  loading?: boolean;
};
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  pagination = true,
  pageSize = 10,
  emptyMessage = 'No data found',
  onRowClick,
  actions,
  loading = false
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!search) return data;
    const searchLower = search.toLowerCase();
    const keysToSearch = searchKeys.length > 0 ? searchKeys : columns.map(c => c.key);
    return data.filter(item => keysToSearch.some(key => {
      const value = item[key];
      if (value == null) return false;
      return String(value).toLowerCase().includes(searchLower);
    }));
  }, [data, search, searchKeys, columns]);
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true
      });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);
  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };
  if (loading) {
    return <div className="space-y-4">
        {searchable && <div className="max-w-sm">
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 lg:px-6 py-3">
            <div className="flex gap-4">
              {columns.map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />)}
            </div>
          </div>
          {[...Array(5)].map((_, i) => <div key={i} className="px-4 lg:px-6 py-4 border-t border-gray-100">
              <div className="flex gap-4">
                {columns.map((_, j) => <div key={j} className="h-4 bg-gray-100 rounded flex-1 animate-pulse" />)}
              </div>
            </div>)}
        </div>
      </div>;
  }
  return <div className="space-y-4">
      {/* Search */}
      {searchable && <div className="max-w-sm">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={handleSearchChange} placeholder={searchPlaceholder} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          </div>
        </div>}

      {/* Desktop Table */}
      <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map(column => <th key={column.key} className={`
                      px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider
                      ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}
                    `} style={{
                width: column.width
              }} onClick={column.sortable ? () => handleSort(column.key) : undefined}>
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && sortKey === column.key && (sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />)}
                    </div>
                  </th>)}
                {actions && <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 lg:px-6 py-12 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr> : paginatedData.map((item, index) => <tr key={keyExtractor(item)} className={`
                      bg-white
                      ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    `} onClick={onRowClick ? () => onRowClick(item) : undefined}>
                    {columns.map(column => <td key={column.key} className="px-4 lg:px-6 py-4 text-sm text-gray-700">
                        {column.render ? column.render(item[column.key], item, index) : String(item[column.key] ?? '-')}
                      </td>)}
                    {actions && <td className="px-4 lg:px-6 py-4 text-right">
                        <div onClick={e => e.stopPropagation()}>
                          {actions(item)}
                        </div>
                      </td>}
                  </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paginatedData.length === 0 ? <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            {emptyMessage}
          </div> : paginatedData.map((item, index) => <div key={keyExtractor(item)} className={`
                bg-white rounded-xl border border-gray-200 p-4 space-y-3
                ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}
              `} onClick={onRowClick ? () => onRowClick(item) : undefined}>
              {columns.filter(col => !col.hideOnMobile).map(column => <div key={column.key} className="flex justify-between items-start gap-3">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {column.label}
                    </span>
                    <div className="text-sm text-gray-900 text-right flex-1">
                      {column.render ? column.render(item[column.key], item, index) : String(item[column.key] ?? '-')}
                    </div>
                  </div>)}
              {actions && <div className="pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                  {actions(item)}
                </div>}
            </div>)}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {sortedData.length} results
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} icon={<ChevronLeftIcon className="w-4 h-4" />}>
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`
                      w-8 h-8 rounded-lg text-sm font-medium transition-colors
                      ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
                    `}>
                    {pageNum}
                  </button>;
          })}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>}
    </div>;
}