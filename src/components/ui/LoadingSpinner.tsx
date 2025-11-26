import { classNames } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
  };

  return (
    <span
      className={classNames(
        'loading loading-spinner',
        sizeClasses[size],
        className
      )}
    ></span>
  );
}