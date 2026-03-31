import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variantStyles = {
    default: 'bg-bg-tertiary/70 text-text-primary border border-stroke',
    success: 'bg-success/15 text-success border border-success/40',
    warning: 'bg-warning/15 text-warning border border-warning/40',
    danger: 'bg-danger/15 text-danger border border-danger/40',
    info: 'bg-info/15 text-info border border-info/40',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
