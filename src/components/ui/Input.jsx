import React from 'react';

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input 
        className={`px-4 py-2 bg-white dark:bg-dark-bg border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-dark-border focus:ring-primary-500'} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent dark:text-white transition-colors`}
        {...props}
      />
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
};

export default Input;
