import React from 'react';

/**
 * Card — Componente base de contenedor tipo Canvas LMS
 *
 * Props:
 *  - hover    : boolean — Activa efecto lift en hover
 *  - padding  : 'none' | 'sm' | 'md' | 'lg'
 *  - glass    : boolean — Fondo glassmorphism
 *  - className: string
 */
const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
  xl:   'p-8',
};

const Card = ({
  children,
  hover = false,
  padding = 'md',
  glass = false,
  className = '',
  onClick,
  ...props
}) => {
  const base = glass
    ? 'glass dark:glass-dark border border-white/20 dark:border-white/5 rounded-2xl'
    : 'bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded-2xl';

  const hoverClass = hover
    ? 'card-hover cursor-pointer'
    : '';

  const shadowClass = hover
    ? 'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)]'
    : 'shadow-[var(--shadow-card)]';

  return (
    <div
      className={[base, hoverClass, shadowClass, PADDING[padding] || PADDING.md, className].join(' ')}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────
Card.Header = ({ children, className = '', border = true }) => (
  <div className={[
    border ? 'border-b border-slate-100 dark:border-dark-border pb-4 mb-4' : '',
    'flex items-center justify-between gap-3',
    className,
  ].join(' ')}>
    {children}
  </div>
);

Card.Title = ({ children, className = '' }) => (
  <h3 className={`font-bold text-slate-800 dark:text-white text-base leading-tight ${className}`}>
    {children}
  </h3>
);

Card.Subtitle = ({ children, className = '' }) => (
  <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 ${className}`}>
    {children}
  </p>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`border-t border-slate-100 dark:border-dark-border pt-4 mt-4 ${className}`}>
    {children}
  </div>
);

export default Card;
