import React, { forwardRef } from 'react';
import { ChevronDownIcon } from 'lucide-react';
type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};
type SelectProps = {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  placeholder?: string;
  className?: string;
};
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  name,
  id,
  placeholder = 'Select an option',
  className = ''
}, ref) => {
  const selectId = id || name || Math.random().toString(36).substring(2, 9);
  return <div className={`space-y-1.5 ${className}`}>
        {label && <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>}
        <div className="relative">
          <select ref={ref} id={selectId} name={name} value={value} onChange={onChange} onBlur={onBlur} disabled={disabled} required={required} className={`
            block w-full px-3 py-2 pr-10 rounded-lg border appearance-none
            text-gray-900 bg-white
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'}
          `} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}>
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>)}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {error && <p id={`${selectId}-error`} className="text-sm text-red-600">
            {error}
          </p>}
        {hint && !error && <p id={`${selectId}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>}
      </div>;
});
Select.displayName = 'Select';