/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Library Theme Color System - Warm, Cozy, High Contrast
        primary: {
          50: '#fff8f0',  // Lightest cream
          100: '#ffefd9', // Light cream
          200: '#ffd9a8', // Warm peach
          300: '#ffb870', // Light orange
          400: '#ff9e45', // Medium orange
          500: '#ff8022', // Primary orange
          600: '#ea6b0a', // Deep orange
          700: '#c25404', // Burnt orange
          800: '#9a4507', // Dark orange
          900: '#7c3a0b', // Darkest orange
        },
        secondary: {
          50: '#fef9f3',  // Light warm beige
          100: '#fef0e0', // Warm beige
          200: '#fcd9ac', // Light amber
          300: '#f9bc70', // Amber
          400: '#f59e42', // Golden amber
          500: '#ed7f1c', // Deep amber
          600: '#dc6211', // Dark amber
          700: '#b84b11', // Burnt amber
          800: '#953f15', // Deep burnt amber
          900: '#7a3516', // Darkest amber
        },
        accent: {
          50: '#fdf8f6',  // Lightest brown
          100: '#f9ede8', // Light brown
          200: '#f0d5c9', // Soft brown
          300: '#e3b5a1', // Medium brown
          400: '#d4916f', // Warm brown
          500: '#c76d48', // Rich brown
          600: '#b85333', // Deep brown
          700: '#9a4129', // Dark brown
          800: '#7f3825', // Darker brown
          900: '#693023', // Darkest brown
        },
        // Library Theme Surface Colors
        surface: {
          // Light theme - warm paper and wood tones
          'light': {
            DEFAULT: '#fef9f3',      // Warm paper white
            elevated: '#fff8f0',      // Elevated paper
            container: '#f9ede8',     // Warm container
            card: '#ffffff',          // Pure white cards for contrast
          },
          // Dark theme - cozy library at night
          'dark': {
            DEFAULT: '#1a0f08',       // Deep warm black
            elevated: {
              1: 'rgba(255,178,102,0.03)', // Warm glow
              2: 'rgba(255,178,102,0.05)',
              3: 'rgba(255,178,102,0.07)',
              4: 'rgba(255,178,102,0.09)',
              6: 'rgba(255,178,102,0.11)',
              8: 'rgba(255,178,102,0.13)',
              12: 'rgba(255,178,102,0.15)',
              16: 'rgba(255,178,102,0.17)',
              24: 'rgba(255,178,102,0.19)',
            },
            container: '#2a1810',     // Warm dark container
            variant: '#3d2817',       // Warm dark variant
            card: '#241409',          // Dark card with warmth
          },
        },
        // On-surface colors for text and icons - HIGH CONTRAST
        'on-surface': {
          light: {
            DEFAULT: '#2c2416',       // Very dark brown (WCAG AAA)
            variant: '#5d4a37',       // Medium brown  (WCAG AA)
            muted: '#7a6550',         // Muted brown (WCAG AA)
            disabled: 'rgba(44,36,22,0.38)',
          },
          dark: {
            DEFAULT: 'rgba(255,250,240,0.95)', // Very bright (WCAG AAA)
            variant: 'rgba(255,235,215,0.87)', // Bright (WCAG AA)
            muted: 'rgba(255,220,190,0.75)',   // Muted bright (WCAG AA)
            disabled: 'rgba(255,250,240,0.38)',
          },
        },
        // Error colors with library theme
        error: {
          light: '#c74029',          // Warm red-brown error
          dark: '#ff8670',           // Bright warm error for dark mode
        },
        // Outline colors with warm tones
        outline: {
          light: '#9a8070',          // Warm brown outline
          dark: '#b89580',           // Light brown outline
        },
        // Library-specific colors
        fireplace: {
          glow: '#ff6b35',    // Fireplace glow
          flame: '#ff8c42',   // Flame color
          ember: '#ff4500',   // Ember red-orange
          warm: '#ffaa5a',    // Warm light
        },
        library: {
          wood: '#8b4513',     // Dark wood
          'wood-light': '#a0522d', // Light wood
          leather: '#654321',  // Leather bound books
          paper: '#fef9e7',    // Old paper
          ink: '#2c2416',      // Dark ink
          gold: '#d4af37',     // Gold accents
        },
        reading: {
          chair: '#8b7355',    // Reading chair brown
          lamp: '#ffdb58',     // Lamp warm yellow
          carpet: '#8b4726',   // Carpet red-brown
        },
        neon: {
          blue: '#00d4ff',
          purple: '#a855f7',
          pink: '#ec4899',
          green: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fireplace-flicker': 'fireplaceFlicker 2s ease-in-out infinite',
        'ember-rise': 'emberRise 4s ease-in-out infinite',
        'wind-drift': 'windDrift 15s linear infinite',
        'book-float': 'bookFloat 6s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.6s ease-out',
        'slideUp': 'slideUp 0.5s ease-out',
        'warm-glow': 'warmGlow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px theme(colors.primary.500), 0 0 10px theme(colors.primary.500)' },
          '100%': { boxShadow: '0 0 10px theme(colors.primary.500), 0 0 20px theme(colors.primary.500), 0 0 30px theme(colors.primary.500)' },
        },
        fireplaceFlicker: {
          '0%, 100%': { 
            opacity: 1, 
            filter: 'brightness(1)' 
          },
          '25%': { 
            opacity: 0.9, 
            filter: 'brightness(1.1)' 
          },
          '50%': { 
            opacity: 0.95, 
            filter: 'brightness(0.95)' 
          },
          '75%': { 
            opacity: 1, 
            filter: 'brightness(1.05)' 
          },
        },
        emberRise: {
          '0%': { 
            transform: 'translateY(0) translateX(0) scale(1)', 
            opacity: 0.8 
          },
          '50%': { 
            transform: 'translateY(-30px) translateX(5px) scale(0.8)', 
            opacity: 0.4 
          },
          '100%': { 
            transform: 'translateY(-60px) translateX(-5px) scale(0.5)', 
            opacity: 0 
          },
        },
        windDrift: {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(15px) translateY(-10px)' },
          '50%': { transform: 'translateX(5px) translateY(-20px)' },
          '75%': { transform: 'translateX(-10px) translateY(-15px)' },
          '100%': { transform: 'translateX(0) translateY(0)' },
        },
        bookFloat: {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)' 
          },
          '33%': { 
            transform: 'translateY(-15px) rotate(2deg)' 
          },
          '66%': { 
            transform: 'translateY(-8px) rotate(-2deg)' 
          },
        },
        warmGlow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(255,128,34,0.3), 0 0 40px rgba(255,128,34,0.2)' 
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(255,128,34,0.5), 0 0 60px rgba(255,128,34,0.3), 0 0 80px rgba(255,128,34,0.1)' 
          },
        },
        sparkle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.5, transform: 'scale(0.8)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(30px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      // Material Design Elevation System
      boxShadow: {
        // Light theme elevations
        'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'elevation-2': '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
        'elevation-3': '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
        'elevation-4': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
        'elevation-5': '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
        // Dark theme elevations (reduced intensity)
        'elevation-dark-1': '0 1px 3px rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.30)',
        'elevation-dark-2': '0 3px 6px rgba(0,0,0,0.25), 0 3px 6px rgba(0,0,0,0.35)',
        'elevation-dark-3': '0 10px 20px rgba(0,0,0,0.30), 0 6px 6px rgba(0,0,0,0.35)',
        'elevation-dark-4': '0 14px 28px rgba(0,0,0,0.35), 0 10px 10px rgba(0,0,0,0.30)',
        'elevation-dark-5': '0 19px 38px rgba(0,0,0,0.40), 0 15px 12px rgba(0,0,0,0.30)',
      },
      backdropBlur: {
        xs: '2px',
        material: '10px', // Material Design glassmorphism
      },
      screens: {
        xs: '475px',
      }
    },
  },
  plugins: [],
};