import React from 'react';

const VARIANTS = {
  primary:   'bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white shadow-sm hover:shadow-md focus-visible:ring-primary-500',
  secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-dark-hover dark:hover:bg-dark-border text-slate-700 dark:text-slate-300 focus-visible:ring-slate-400',
  danger:    'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-sm hover:shadow-md focus-visible:ring-red-500',
  outline:   'border-2 border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus-visible:ring-primary-500',
  ghost:     'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover hover:text-slate-800 dark:hover:text-slate-200 focus-visible:ring-slate-400',
  success:   'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-md focus-visible:ring-emerald-500',
};

const SIZES = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
  xl: 'px-6 py-3 text-base gap-2.5',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  leftIcon = null,
  rightIcon = null,
  ...props
}) => (
  <button
    className={[
      'lms-btn',
      VARIANTS[variant] || VARIANTS.primary,
      SIZES[size] || SIZES.md,
      'focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg',
      className,
    ].join(' ')}
    disabled={isLoading || props.disabled}
    {...props}
  >
    {isLoading ? (
      <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    ) : leftIcon ? (
      <span className="flex-shrink-0">{leftIcon}</span>
    ) : null}
    {children}
    {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
  </button>
);

export default Button;
