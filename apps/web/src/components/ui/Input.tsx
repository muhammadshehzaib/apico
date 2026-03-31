import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 bg-bg-secondary/80 text-text-primary border border-stroke rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 placeholder:text-text-muted/60 ${error ? 'border-danger/80 focus:ring-danger/30' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-danger text-sm mt-1">{error}</p>}
        {helperText && !error && <p className="text-text-muted text-sm mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
