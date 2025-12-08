import React, { forwardRef } from 'react';
type TextAreaProps = {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  rows?: number;
  className?: string;
  maxLength?: number;
};
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  label,
  error,
  hint,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  name,
  id,
  rows = 4,
  className = '',
  maxLength
}, ref) => {
  const textareaId = id || name || Math.random().toString(36).substring(2, 9);
  return <div className={`space-y-1.5 ${className}`}>
        {label && <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>}
        <textarea ref={ref} id={textareaId} name={name} value={value} onChange={onChange} onBlur={onBlur} disabled={disabled} required={required} placeholder={placeholder} rows={rows} maxLength={maxLength} className={`
          block w-full px-3 py-2 rounded-lg border resize-none
          text-gray-900 placeholder-gray-400
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'}
        `} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined} />
        <div className="flex justify-between">
          {error && <p id={`${textareaId}-error`} className="text-sm text-red-600">
              {error}
            </p>}
          {hint && !error && <p id={`${textareaId}-hint`} className="text-sm text-gray-500">
              {hint}
            </p>}
          {maxLength && <p className="text-sm text-gray-400 ml-auto">
              {value?.length || 0}/{maxLength}
            </p>}
        </div>
      </div>;
});
TextArea.displayName = 'TextArea';