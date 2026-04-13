import React from 'react';

const VARIANTS = {
  default:  'bg-slate-100 dark:bg-dark-hover text-slate-700 dark:text-slate-300',
  primary:  'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  success:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  warning:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  danger:   'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  info:     'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  purple:   'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  solid_primary: 'bg-primary-600 text-white',
  solid_success: 'bg-emerald-600 text-white',
  solid_warning: 'bg-amber-500 text-white',
  solid_danger:  'bg-red-600 text-white',
};

const Badge = ({
  children,
  variant = 'default',
  dot = false,
  className = '',
}) => (
  <span className={`badge ${VARIANTS[variant] || VARIANTS.default} ${className}`}>
    {dot && (
      <span className={`mr-1.5 w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${
        variant.includes('success') ? 'bg-emerald-500' :
        variant.includes('warning') ? 'bg-amber-500' :
        variant.includes('danger')  ? 'bg-red-500' :
        variant.includes('primary') ? 'bg-primary-500' :
        'bg-slate-400'
      }`} />
    )}
    {children}
  </span>
);

export default Badge;
