import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantStyles = {
      primary: 'bg-accent text-white hover:bg-blue-600 focus:ring-accent',
      secondary: 'bg-bg-tertiary text-text-primary hover:bg-gray-700 focus:ring-accent',
      danger: 'bg-danger text-white hover:bg-red-600 focus:ring-danger',
      ghost: 'text-text-primary hover:bg-bg-tertiary focus:ring-accent',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
