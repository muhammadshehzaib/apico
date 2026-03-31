import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary';

    const variantStyles = {
      primary: 'bg-accent text-white border-accent/50 shadow-[0_10px_30px_rgba(58,134,255,0.25)] hover:bg-accent/90 hover:shadow-[0_12px_34px_rgba(58,134,255,0.32)] active:bg-accent/80',
      secondary: 'bg-bg-tertiary/70 text-text-primary border-stroke hover:bg-bg-tertiary hover:border-accent/40',
      danger: 'bg-danger text-white border-danger/60 shadow-[0_8px_24px_rgba(239,68,68,0.2)] hover:bg-danger/90',
      ghost: 'bg-transparent text-text-primary border-transparent hover:bg-bg-tertiary/60 hover:border-stroke',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
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
