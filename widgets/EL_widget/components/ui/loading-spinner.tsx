import * as React from 'react';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'muted';
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  const colorClasses = {
    primary: 'border-t-primary border-r-primary border-b-transparent',
    white: 'border-t-white border-r-white border-b-transparent',
    muted: 'border-t-muted-foreground/50 border-r-muted-foreground/50 border-b-transparent',
  };

  return (
    <div
      className={cn('inline-block animate-spin rounded-full', sizeClasses[size], colorClasses[color], className)}
      role="status"
      aria-label="Loading..."
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
