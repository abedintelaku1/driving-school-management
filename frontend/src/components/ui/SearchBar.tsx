import React, { useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};
export function SearchBar({
  value,
  onChange,
  placeholder,
  className = ''
}: SearchBarProps) {
  const { t } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);
  const defaultPlaceholder = placeholder || t('common.searchPlaceholder');
  return <div className={`relative ${className}`}>
      <SearchIcon className={`
        absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors
        ${isFocused ? 'text-blue-600' : 'text-gray-400'}
      `} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} placeholder={defaultPlaceholder} className={`
          w-full pl-10 pr-10 py-2 sm:py-2.5 
          border rounded-lg text-sm
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${isFocused ? 'border-blue-500' : 'border-gray-300'}
          ${value ? 'pr-10' : 'pr-4'}
        `} />
      {value && <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors" aria-label={t('common.clearSearch')}>
          <XIcon className="w-4 h-4 text-gray-400" />
        </button>}
    </div>;
}