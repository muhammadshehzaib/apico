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
          <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 bg-bg-secondary text-text-primary border border-bg-tertiary rounded focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-danger' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-danger text-sm mt-1">{error}</p>}
        {helperText && !error && <p className="text-text-muted text-sm mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
