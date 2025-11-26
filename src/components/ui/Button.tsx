'use client';

import { forwardRef } from 'react';
import { classNames } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    className,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'btn font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      danger: 'btn-error',
      ghost: 'btn-ghost',
    };

    const sizeClasses = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
    };

    return (
      <button
        ref={ref}
        className={classNames(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          loading && 'loading',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';