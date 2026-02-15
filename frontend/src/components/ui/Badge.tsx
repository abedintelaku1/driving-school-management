import React from 'react';
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
  return <Badge variant={status === 'active' ? 'success' : 'danger'} dot>
      {status === 'active' ? 'Aktive' : 'Joaktive'}
    </Badge>;
}
export function PaymentStatusBadge({
  status
}: {
  status: 'paid' | 'pending' | 'overdue';
}) {
  const variants: Record<string, BadgeVariant> = {
    paid: 'success',
    pending: 'warning',
    overdue: 'danger'
  };
  return <Badge variant={variants[status]} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>;
}
const documentLabels: Record<string, string> = {
  pending: 'Në pritje',
  submitted: 'Dorëzuar',
  approved: 'Aprovuar',
  rejected: 'Refuzuar'
};
export function DocumentStatusBadge({
  status
}: {
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
}) {
  const variants: Record<string, BadgeVariant> = {
    pending: 'default',
    submitted: 'info',
    approved: 'success',
    rejected: 'danger'
  };
  return <Badge variant={variants[status]} size="sm">
      {documentLabels[status] ?? status}
    </Badge>;
}