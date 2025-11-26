'use client';

import { ReactNode, forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Form field wrapper with label and error display
 */
export function FormField({
  label,
  error,
  touched,
  required,
  hint,
  children,
  className = '',
}: FormFieldProps) {
  const showError = touched && error;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !showError && (
        <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
      )}
      {showError && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-fade-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Input component with built-in error styling
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, icon, className = '', ...props }, ref) => {
    const baseClasses = 'w-full py-3 bg-surface-50 border-0 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-200';
    const focusClasses = 'focus:outline-none focus:ring-2';
    const errorClasses = error
      ? 'ring-2 ring-red-500/20 focus:ring-red-500/30'
      : 'focus:ring-primary-500/20';
    const paddingClasses = icon ? 'pl-12 pr-4' : 'px-4';

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${focusClasses} ${errorClasses} ${paddingClasses} ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Select component with built-in error styling
 */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = '', children, ...props }, ref) => {
    const baseClasses = 'w-full px-4 py-3 bg-surface-50 border-0 rounded-xl text-gray-700 transition-all duration-200 cursor-pointer';
    const focusClasses = 'focus:outline-none focus:ring-2';
    const errorClasses = error
      ? 'ring-2 ring-red-500/20 focus:ring-red-500/30'
      : 'focus:ring-primary-500/20';

    return (
      <select
        ref={ref}
        className={`${baseClasses} ${focusClasses} ${errorClasses} ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

/**
 * Textarea component with built-in error styling
 */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    const baseClasses = 'w-full px-4 py-3 bg-surface-50 border-0 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-200 resize-none';
    const focusClasses = 'focus:outline-none focus:ring-2';
    const errorClasses = error
      ? 'ring-2 ring-red-500/20 focus:ring-red-500/30'
      : 'focus:ring-primary-500/20';

    return (
      <textarea
        ref={ref}
        className={`${baseClasses} ${focusClasses} ${errorClasses} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Password input with show/hide toggle
 */
interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showPassword?: boolean;
  onToggleShow?: () => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showPassword, onToggleShow, error, icon, className = '', ...props }, ref) => {
    const baseClasses = 'w-full py-3 bg-surface-50 border-0 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-200';
    const focusClasses = 'focus:outline-none focus:ring-2';
    const errorClasses = error
      ? 'ring-2 ring-red-500/20 focus:ring-red-500/30'
      : 'focus:ring-primary-500/20';
    const paddingClasses = icon ? 'pl-12 pr-12' : 'pl-4 pr-12';

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`${baseClasses} ${focusClasses} ${errorClasses} ${paddingClasses} ${className}`}
          {...props}
        />
        {onToggleShow && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';


