import React, { forwardRef } from 'react';
import { CheckIcon } from 'lucide-react';
type CheckboxProps = {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  description?: string;
};
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  checked = false,
  onChange,
  disabled = false,
  name,
  id,
  className = '',
  description
}, ref) => {
  const checkboxId = id || name || Math.random().toString(36).substring(2, 9);
  return <div className={`flex items-start gap-3 ${className}`}>
        <div className="relative flex items-center">
          <input ref={ref} type="checkbox" id={checkboxId} name={name} checked={checked} onChange={e => onChange?.(e.target.checked)} disabled={disabled} className="sr-only peer" />
          <div className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2
            ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `} onClick={() => !disabled && onChange?.(!checked)}>
            {checked && <CheckIcon className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        </div>
        {(label || description) && <div className="flex-1">
            {label && <label htmlFor={checkboxId} className={`
                text-sm font-medium text-gray-700
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}>
                {label}
              </label>}
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>}
      </div>;
});
Checkbox.displayName = 'Checkbox';