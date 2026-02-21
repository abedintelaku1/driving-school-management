import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md';
type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
};
const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  outline: 'bg-transparent border border-gray-300 text-gray-600'
};
const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm'
};
export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false
}: BadgeProps) {
  return <span className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}>
      {dot && <span className={`
            w-1.5 h-1.5 rounded-full
            ${variant === 'success' ? 'bg-green-500' : ''}
            ${variant === 'warning' ? 'bg-amber-500' : ''}
            ${variant === 'danger' ? 'bg-red-500' : ''}
            ${variant === 'info' ? 'bg-blue-500' : ''}
            ${variant === 'default' ? 'bg-gray-500' : ''}
            ${variant === 'outline' ? 'bg-gray-400' : ''}
          `} />}
      {children}
    </span>;
}
// Convenience components for common status badges
export function StatusBadge({
  status
}: {
  status: 'active' | 'inactive';
}) {
  const { t } = useLanguage();
  return <Badge variant={status === 'active' ? 'success' : 'danger'} dot>
      {status === 'active' ? t('common.active') : t('common.inactive')}
    </Badge>;
}
export function PaymentStatusBadge({
  status
}: {
  status: 'paid' | 'pending' | 'overdue';
}) {
  const { t } = useLanguage();
  const variants: Record<string, BadgeVariant> = {
    paid: 'success',
    pending: 'warning',
    overdue: 'danger'
  };
  const labels: Record<string, string> = {
    paid: t('common.paid'),
    pending: t('common.pending'),
    overdue: t('common.overdue')
  };
  return <Badge variant={variants[status]} dot>
      {labels[status] ?? status}
    </Badge>;
}
export function DocumentStatusBadge({
  status
}: {
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
}) {
  const { t } = useLanguage();
  const variants: Record<string, BadgeVariant> = {
    pending: 'default',
    submitted: 'info',
    approved: 'success',
    rejected: 'danger'
  };
  const labels: Record<string, string> = {
    pending: t('common.pending'),
    submitted: t('common.submitted'),
    approved: t('common.approved'),
    rejected: t('common.rejected')
  };
  return <Badge variant={variants[status]} size="sm">
      {labels[status] ?? status}
    </Badge>;
}