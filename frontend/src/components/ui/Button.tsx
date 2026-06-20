import React from 'react';
import { motion } from 'framer-motion';
import { useThemeColors } from '../../hooks/useTheme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal' | 'primary' | 'secondary' | 'ghost' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'filled',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  fullWidth = false,
  style,
  ...props
}) => {
  const colors = useThemeColors();
  
  const getButtonStyles = () => {
    const baseStyles: React.CSSProperties = {
      borderRadius: '20px', // Material Design 3 pill shape for buttons
      fontWeight: 500,
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      ...style,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: colors.primary,
          color: colors.onPrimary,
          border: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        };
      
      case 'tonal':
        return {
          ...baseStyles,
          backgroundColor: colors.primaryContainer,
          color: colors.primary,
          border: 'none',
        };
      
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: colors.primary,
          border: `1px solid ${colors.outline}`,
        };
      
      case 'text':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: colors.primary,
          border: 'none',
        };
      
      case 'elevated':
        return {
          ...baseStyles,
          backgroundColor: colors.surface,
          color: colors.primary,
          border: 'none',
          boxShadow: colors.isDark 
            ? '0 1px 3px rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.30)'
            : '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        };
      
      // Backwards compatibility variants
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: colors.primary,
          color: colors.onPrimary,
          border: 'none',
        };
      
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: colors.secondary,
          color: colors.onSurface,
          border: 'none',
        };
      
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: colors.onSurfaceVariant,
          border: 'none',
        };
      
      case 'neon':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.25)',
        };
      
      default:
        return baseStyles;
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[32px]',
    md: 'px-6 py-2.5 text-sm min-h-[40px]',
    lg: 'px-8 py-3 text-base min-h-[48px]'
  };

  const buttonClasses = [
    'inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-38 disabled:cursor-not-allowed state-transition btn-interactive ripple',
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    // Focus ring color based on variant
    variant === 'filled' || variant === 'primary' ? 'focus:ring-primary-500/30' : 
    variant === 'outlined' || variant === 'text' ? 'focus:ring-primary-500/30' :
    'focus:ring-gray-500/30',
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={buttonClasses}
      style={getButtonStyles()}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60"
            style={{ borderTopColor: 'transparent' }}
          />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};