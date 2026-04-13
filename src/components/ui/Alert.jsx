import React from 'react';

const Alert = ({ type = 'info', children, className = '' }) => {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50'
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  return (
    <div className={`flex items-start p-4 mb-4 border rounded-lg ${styles[type]} ${className}`} role="alert">
      <span className="mr-3">{icons[type]}</span>
      <div className="flex-1 text-sm font-medium">
        {children}
      </div>
    </div>
  );
};

export default Alert;
