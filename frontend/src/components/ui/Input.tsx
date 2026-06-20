import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 
          bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm
          text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-all duration-200 input-interactive focus-ring
          ${error ? 'border-red-500 focus:ring-red-500 animate-error' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};