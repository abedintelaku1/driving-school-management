import React, { Children, cloneElement, isValidElement } from 'react';
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarProps = {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
};
const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
};
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
function getColorFromName(name: string): string {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
export function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  className = ''
}: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  if (src) {
    return <img src={src} alt={alt || name} className={`
          rounded-full object-cover
          ${sizeStyles[size]}
          ${className}
        `} />;
  }
  return <div className={`
        rounded-full flex items-center justify-center font-medium text-white
        ${sizeStyles[size]}
        ${bgColor}
        ${className}
      `} aria-label={name}>
      {initials}
    </div>;
}
type AvatarGroupProps = {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
};
export function AvatarGroup({
  children,
  max = 4,
  size = 'md'
}: AvatarGroupProps) {
  const childArray = Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;
  return <div className="flex -space-x-2">
      {visibleChildren.map((child, index) => <div key={index} className="ring-2 ring-white rounded-full">
          {isValidElement(child) ? cloneElement(child as React.ReactElement<AvatarProps>, {
        size
      }) : child}
        </div>)}
      {remainingCount > 0 && <div className={`
            rounded-full flex items-center justify-center font-medium
            bg-gray-200 text-gray-600 ring-2 ring-white
            ${sizeStyles[size]}
          `}>
          +{remainingCount}
        </div>}
    </div>;
}