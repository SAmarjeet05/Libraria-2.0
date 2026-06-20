import React from 'react';
import { motion } from 'framer-motion';
import { useThemeColors, useElevation } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  variant?: 'elevated' | 'filled' | 'outlined' | 'glass';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  glow = false,
  elevation = 1,
  variant = 'glass', // Keep glass as default for backwards compatibility
  onClick,
  style,
}) => {
  const colors = useThemeColors();
  const shadowStyle = useElevation(elevation);
  
  const getCardStyles = () => {
    const baseStyles: React.CSSProperties = {
      borderRadius: '12px',
      transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      ...style,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          backgroundColor: colors.surface,
          color: colors.onSurface,
          boxShadow: shadowStyle,
          border: 'none',
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: colors.surfaceContainer,
          color: colors.onSurface,
          boxShadow: 'none',
          border: 'none',
        };
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: colors.surface,
          color: colors.onSurface,
          border: `1px solid ${colors.outline}`,
          boxShadow: 'none',
        };
      case 'glass':
      default:
        // Keep existing glass style for backwards compatibility
        return {
          ...baseStyles,
          backgroundColor: colors.isDark 
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
          color: colors.onSurface,
        };
    }
  };

  const hoverStyles = hover ? {
    whileHover: { 
      y: -4,
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    whileTap: { 
      scale: 0.98,
      transition: { duration: 0.1, ease: 'easeIn' }
    }
  } : {};

  const cardClasses = [
    'transition-all duration-300 card-interactive',
    hover ? 'cursor-pointer' : '',
    hover && variant === 'glass' ? 'hover:bg-white/15 dark:hover:bg-white/10 hover:border-white/30 dark:hover:border-white/20' : '',
    // Material Design elevation classes for dark theme
    colors.isDark && variant === 'elevated' && elevation > 0 ? `surface-elevated-${Math.min(elevation * 4, 24)}` : '',
    glow ? 'shadow-lg shadow-neon-blue/10 hover:shadow-neon-blue/20 animate-pulse-glow' : variant === 'glass' ? 'shadow-lg' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      className={cardClasses}
      style={getCardStyles()}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...hoverStyles}
    >
      <div 
        className={hover && variant !== 'glass' ? 'state-hover state-focus' : ''}
        style={{ 
          borderRadius: 'inherit',
          padding: '24px', // 6 * 4px (Tailwind p-6 equivalent)
          transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};