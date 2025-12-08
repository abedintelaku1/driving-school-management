import React, { forwardRef } from 'react';
type InputProps = {
  label?: string;
  error?: string;
  hint?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date';
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  autoComplete?: string;
};
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  autoComplete
}, ref) => {
  const inputId = id || name || Math.random().toString(36).substring(2, 9);
  return <div className={`space-y-1.5 ${className}`}>
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>}
        <input ref={ref} id={inputId} name={name} type={type} value={value} onChange={onChange} onBlur={onBlur} disabled={disabled} required={required} placeholder={placeholder} autoComplete={autoComplete} className={`
          block w-full px-3 py-2 rounded-lg border
          text-gray-900 placeholder-gray-400
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'}
        `} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined} />
        {error && <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>}
        {hint && !error && <p id={`${inputId}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>}
      </div>;
});
Input.displayName = 'Input';