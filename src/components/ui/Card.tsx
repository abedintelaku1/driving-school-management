import React, { Component } from 'react';
type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
};
const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};
export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick
}: CardProps) {
  const Component = onClick ? 'button' : 'div';
  return <Component onClick={onClick} className={`
        bg-white rounded-xl border border-gray-200 shadow-sm
        ${paddingStyles[padding]}
        ${hover ? 'transition-shadow hover:shadow-md cursor-pointer' : ''}
        ${onClick ? 'text-left w-full' : ''}
        ${className}
      `}>
      {children}
    </Component>;
}
type CardHeaderProps = {
  children: React.ReactNode;
  className?: string;
};
export function CardHeader({
  children,
  className = ''
}: CardHeaderProps) {
  return <div className={`pb-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>;
}
type CardTitleProps = {
  children: React.ReactNode;
  className?: string;
};
export function CardTitle({
  children,
  className = ''
}: CardTitleProps) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>;
}
type CardDescriptionProps = {
  children: React.ReactNode;
  className?: string;
};
export function CardDescription({
  children,
  className = ''
}: CardDescriptionProps) {
  return <p className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</p>;
}
type CardContentProps = {
  children: React.ReactNode;
  className?: string;
};
export function CardContent({
  children,
  className = ''
}: CardContentProps) {
  return <div className={`pt-4 ${className}`}>{children}</div>;
}
type CardFooterProps = {
  children: React.ReactNode;
  className?: string;
};
export function CardFooter({
  children,
  className = ''
}: CardFooterProps) {
  return <div className={`pt-4 mt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>;
}