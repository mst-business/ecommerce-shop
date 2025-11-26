'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Spinner component for loading states
 */
function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * Button with loading state support
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      loading = false,
      loadingText,
      icon,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-xl disabled:cursor-not-allowed';

    // Size classes
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3',
      lg: 'px-8 py-4 text-lg',
    };

    // Variant classes
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/25 disabled:bg-gray-300 disabled:shadow-none',
      secondary: 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 disabled:bg-gray-50 disabled:text-gray-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 disabled:bg-gray-300',
      ghost: 'bg-transparent text-gray-600 hover:text-primary-600 hover:bg-primary-50 disabled:text-gray-400',
    };

    // Width class
    const widthClass = fullWidth ? 'w-full' : '';

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
            {loadingText || 'Loading...'}
          </>
        ) : (
          <>
            {icon}
            {children}
          </>
        )}
      </button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

/**
 * Icon button with loading state
 */
interface IconButtonProps extends Omit<LoadingButtonProps, 'children'> {
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      loading = false,
      icon,
      variant = 'ghost',
      size = 'md',
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center transition-all duration-200 rounded-xl disabled:cursor-not-allowed';

    const sizeClasses = {
      sm: 'p-2',
      md: 'p-2.5',
      lg: 'p-3',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300',
      secondary: 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600 disabled:bg-gray-50 disabled:text-gray-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300',
      ghost: 'text-gray-500 hover:text-primary-600 hover:bg-primary-50 disabled:text-gray-400',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <Spinner className={iconSizes[size]} />
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';


