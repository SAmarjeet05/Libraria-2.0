import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme, useThemeColors } from '../../hooks/useTheme';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'segmented';
  showSystemOption?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  showSystemOption = true,
  size = 'md'
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const colors = useThemeColors();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size];

  const getThemeIcon = (themeMode: typeof theme) => {
    switch (themeMode) {
      case 'light':
        return <SunIcon className={iconSize} />;
      case 'dark':
        return <MoonIcon className={iconSize} />;
      case 'system':
        return <ComputerDesktopIcon className={iconSize} />;
      default:
        return <SunIcon className={iconSize} />;
    }
  };

  if (variant === 'icon') {
    return (
      <motion.button
        onClick={toggleTheme}
        className="relative p-2 rounded-lg bg-white/10 dark:bg-gray-900/20 backdrop-blur-md border border-white/20 dark:border-gray-800/30 hover:bg-white/15 dark:hover:bg-gray-900/30 transition-all duration-300 state-hover state-focus btn-interactive focus-ring ripple"
        style={{
          backgroundColor: colors.isDark 
            ? 'color-mix(in srgb, transparent 80%, white 20%)'
            : 'color-mix(in srgb, transparent 90%, black 10%)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
        title={`Current: ${theme} theme (resolved: ${resolvedTheme})`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15 
            }}
            className="flex items-center justify-center icon-rotate"
            style={{ color: colors.onSurface }}
          >
            {getThemeIcon(theme)}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors input-interactive state-transition focus-ring"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.outline,
            color: colors.onSurface,
          }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          {showSystemOption && <option value="system">System</option>}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    );
  }

  if (variant === 'segmented') {
    const themes = showSystemOption 
      ? [
          { key: 'light' as const, label: 'Light', icon: SunIcon },
          { key: 'system' as const, label: 'System', icon: ComputerDesktopIcon },
          { key: 'dark' as const, label: 'Dark', icon: MoonIcon },
        ]
      : [
          { key: 'light' as const, label: 'Light', icon: SunIcon },
          { key: 'dark' as const, label: 'Dark', icon: MoonIcon },
        ];

    return (
      <div 
        className="relative flex rounded-lg p-1"
        style={{
          backgroundColor: colors.surfaceContainer,
          border: `1px solid ${colors.outline}`,
        }}
      >
        {themes.map(({ key, label, icon: Icon }) => (
          <motion.button
            key={key}
            onClick={() => setTheme(key)}
            className={`
              relative flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 btn-interactive state-transition ripple
              ${theme === key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}
            `}
            style={{
              color: theme === key ? colors.primary : colors.onSurfaceVariant,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {theme === key && (
              <motion.div
                layoutId="activeTheme"
                className="absolute inset-0 rounded-md"
                style={{
                  backgroundColor: colors.primaryContainer,
                }}
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
            <Icon className={`relative z-10 ${iconSize}`} />
            <span className="relative z-10">{label}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  return null;
};