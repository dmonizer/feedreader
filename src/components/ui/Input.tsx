'use client';

import { forwardRef } from 'react';
import { classNames } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helpText,
    leftIcon,
    rightIcon,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="form-control w-full">
        {label && (
          <label className="label" htmlFor={inputId}>
            <span className="label-text font-medium">{label}</span>
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={classNames(
              'input input-bordered w-full',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              error ? 'input-error' : '',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helpText) && (
          <label className="label">
            <span className={classNames(
              'label-text-alt',
              error ? 'text-error' : 'text-base-content/70'
            )}>
              {error || helpText}
            </span>
          </label>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';