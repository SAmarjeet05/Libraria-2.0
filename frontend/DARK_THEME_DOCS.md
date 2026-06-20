# Material Design 3 Dark Theme Implementation

This document outlines the comprehensive Material Design 3 dark theme implementation for the Libraria AI application, following Google's official guidelines for accessibility, elevation, and color systems.

## 🎨 Color System

### Base Colors
- **Surface**: `#121212` (Material Design recommended dark surface)
- **Primary**: `#bae6fd` (Desaturated for dark theme accessibility)
- **Secondary**: `#99f6e4` (Teal variant for accents)
- **Error**: `#CF6679` (Lightened for WCAG AA compliance)

### Text Colors (On-Surface)
- **High Emphasis**: `rgba(255,255,255,0.87)` - Primary text
- **Medium Emphasis**: `rgba(255,255,255,0.60)` - Secondary text
- **Disabled**: `rgba(255,255,255,0.38)` - Disabled elements

## 🏗️ Elevation System

Material Design 3 uses elevation overlays in dark theme to express depth:

| Level | Overlay | Use Case |
|-------|---------|----------|
| 0dp   | 0%      | Background |
| 1dp   | 5%      | Cards, chips |
| 2dp   | 7%      | Elevated cards |
| 3dp   | 8%      | Navigation drawer |
| 4dp   | 9%      | App bar |
| 6dp   | 11%     | FAB |
| 8dp   | 12%     | Nav drawer, bottom nav |
| 12dp  | 14%     | Modal bottom sheet |
| 16dp  | 15%     | Nav drawer (modal) |
| 24dp  | 16%     | Dialog |

## 🎯 Implementation Details

### Core Components

#### ThemeProvider (`/src/contexts/ThemeProvider.tsx`)
- Manages theme state with system preference support
- Provides theme utilities and color tokens
- Handles localStorage persistence
- Updates browser meta theme-color

#### Enhanced Components
- **Card**: Material elevation with proper surface overlays
- **Button**: MD3 button variants (filled, outlined, text, elevated, tonal)
- **ThemeToggle**: Icon, dropdown, and segmented variants with system support

### CSS Architecture

#### Custom Properties (`/src/index.css`)
```css
:root {
  /* Light theme */
  --md-surface: #ffffff;
  --md-on-surface: #1c1b1f;
  --md-primary: #0ea5e9;
}

.dark {
  /* Dark theme */
  --md-surface: #121212;
  --md-on-surface: rgba(255,255,255,0.87);
  --md-primary: #bae6fd;
}
```

#### Elevation Classes
```css
.surface-elevated-1 { /* 5% white overlay in dark theme */ }
.surface-elevated-2 { /* 7% white overlay in dark theme */ }
/* ... up to 24dp */
```

#### Typography Scale
Material Design 3 typography scale with proper weights and spacing:
- Display (Large, Medium, Small)
- Headline (Large, Medium, Small) 
- Title (Large, Medium, Small)
- Body (Large, Medium, Small)
- Label (Large, Medium, Small)

### Accessibility

#### WCAG AA Compliance
- **15.8:1** contrast ratio between white text and dark surface
- **4.5:1** minimum contrast for body text on all elevation levels
- Proper focus indicators and state overlays

#### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  /* Minimize animations */
}
```

#### High Contrast Mode
- Optional enhanced contrast settings
- Configurable in preferences

## 🔧 Usage Examples

### Theme Provider Setup
```tsx
import { ThemeProvider } from './contexts/ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem={true}>
      <YourApp />
    </ThemeProvider>
  );
}
```

### Using Theme Colors
```tsx
import { useThemeColors } from './hooks/useTheme';

function MyComponent() {
  const colors = useThemeColors();
  
  return (
    <div style={{ 
      backgroundColor: colors.surface,
      color: colors.onSurface 
    }}>
      Content with proper theming
    </div>
  );
}
```

### Material Design Cards
```tsx
<Card 
  variant="elevated" 
  elevation={2}
  hover={true}
>
  Card content with proper elevation
</Card>
```

### Theme Toggle Variants
```tsx
{/* Icon toggle */}
<ThemeToggle />

{/* Dropdown */}
<ThemeToggle variant="dropdown" />

{/* Segmented control */}
<ThemeToggle variant="segmented" showSystemOption={true} />
```

## 🎮 Interactive Features

### System Theme Detection
- Automatically detects user's OS theme preference
- Responds to system theme changes in real-time
- Respects user override settings

### Smooth Transitions
- 300ms cubic-bezier transitions for theme switching
- Preserved component state during theme changes
- Optimized for 60fps animations

### Mobile Integration
- Dynamic theme-color meta tags for browser chrome
- OLED-optimized true black option
- Touch-friendly interaction targets

## 📱 Mobile Optimizations

### OLED Support
- True black (`#000000`) option for battery conservation
- Careful pixel management for OLED burn-in prevention
- Optimized for AMOLED displays

### Browser Chrome Theming
```html
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)" />
```

## 🧪 Testing

### Cross-Platform Testing
- ✅ Chrome/Edge (Blink)
- ✅ Firefox (Gecko) 
- ✅ Safari (WebKit)
- ✅ Mobile browsers

### Accessibility Testing
- ✅ Screen reader compatibility
- ✅ Keyboard navigation
- ✅ High contrast mode
- ✅ Focus indicators

### Performance
- ✅ 60fps animations
- ✅ Minimal layout shifts
- ✅ Efficient CSS custom properties

## 🔮 Future Enhancements

### Dynamic Color (Material You)
- Wallpaper-based color extraction
- Adaptive color palettes
- Per-user color customization

### Advanced Theming
- Custom brand color overlays
- Seasonal theme variations
- Accessibility-focused themes

### Framework Integration
- React Native compatibility
- PWA manifest theming
- Desktop app title bar theming

## 📚 References

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Dark Theme Specification](https://material.io/design/color/dark-theme.html)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/AA/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

---

*This implementation ensures a consistent, accessible, and beautiful dark theme experience across all platforms while following Material Design 3 principles and modern web standards.*