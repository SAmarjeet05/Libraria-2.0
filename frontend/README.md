# Libraria AI - Next-Generation Knowledge Management Platform

A comprehensive React 18+ application combining an anime-styled landing page with a modular AI-powered web application for library management, healthcare, and smart documentation.

## 🚀 Features

### Core Technology Stack
- **React 18+** with TypeScript
- **Vite** for lightning-fast development
- **TailwindCSS** for responsive design
- **Framer Motion** for smooth animations
- **React Router** for navigation

### Key Modules
- 📚 **Library Management** - Complete digital library solution
- 🏥 **Healthcare** - Patient management and workflows  
- 📝 **Smart Notes** - AI-powered note-taking
- ⚙️ **Settings** - Comprehensive app configuration

### Advanced Features
- 🎤 **Voice Integration** - Web Speech API support
- 🌙 **Material Design 3 Dark Theme** - Complete implementation with system preference detection
- 📱 **Responsive Design** - Mobile-first approach
- 🔐 **Role-Based Access** - User/Admin permission system
- ⚡ **Performance Optimized** - Code splitting and lazy loading
- ♿ **Accessibility** - WCAG AA compliance

## 🏗️ Architecture

### Modular Structure
```
src/
├── components/          # Shared UI components
│   ├── ui/             # Base UI components (Button, Card, Input)
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (AppShell)
│   └── features/       # Feature-specific components
├── modules/            # Feature modules (extractable)
│   ├── library/        # Library management module
│   ├── notes/          # Notes module
│   ├── healthcare/     # Healthcare module
│   └── settings/       # Settings module
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── content/            # Content JSON files
├── mockData/           # Demo data
└── utils/              # Utility functions
```

### Performance Features
- **Code Splitting**: Each module is lazy-loaded
- **Bundle Optimization**: Vendor chunks separated
- **Image Optimization**: Lazy loading with Pexels integration
- **Reduced Motion Support**: Respects user preferences

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd libraria-ai
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173)

3. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## 🔐 Authentication

### Demo Accounts
The application includes a demo authentication system:

- **User Account**: `user@example.com` / `demo123`
- **Admin Account**: `admin@example.com` / `demo123`

### Integration Notes
- Auth state persists in localStorage
- Ready for backend integration
- Role-based access control implemented
- Clear integration points marked with comments

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#0ea5e9 to #0369a1)
- **Accent**: Pink gradient (#ec4899 to #be185d)
- **Neon**: Vibrant accents for highlights
- **Neutral**: Adaptive grays for light/dark themes

### Typography
- **Font**: Inter (system fallback)
- **Scale**: Consistent spacing (8px base unit)
- **Weights**: 300, 400, 500, 600, 700

### Components
- **Glassmorphism**: Backdrop blur with transparency
- **Micro-interactions**: Hover states and transitions
- **Accessibility**: Keyboard navigation and ARIA labels

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px
- **XS**: 475px (custom)

### Mobile Features
- Collapsible sidebar
- Touch-optimized interactions
- Optimized font sizes
- Responsive grids

## 🧩 Module Development

### Creating New Modules

1. **Create module directory**
   ```
   src/modules/your-module/
   ├── YourModule.tsx      # Main module component
   ├── views/              # Module views
   ├── components/         # Module-specific components
   └── types/              # Module types
   ```

2. **Add to routing**
   ```tsx
   // In App.tsx
   const YourModule = lazy(() => import('./modules/your-module/YourModule'));
   
   // Add route
   <Route path="your-module/*" element={<YourModule />} />
   ```

3. **Update content.json**
   ```json
   {
     "app": {
       "modules": [
         {
           "id": "your-module",
           "name": "Your Module",
           "path": "/app/your-module",
           "icon": "YourIcon",
           "description": "Module description",
           "requiresAuth": true,
           "allowedRoles": ["User", "Admin"]
         }
       ]
     }
   }
   ```

### Module Guidelines
- Keep modules under 300 lines per file
- Use proper imports/exports
- Implement proper TypeScript interfaces
- Follow accessibility guidelines
- Include error boundaries

## 🎯 Voice Integration

### Web Speech API
- Automatic browser support detection
- Graceful degradation for unsupported browsers
- Real-time transcription display
- Copy/clear functionality

### Usage Example
```tsx
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const { isSupported, transcript, startListening, stopListening } = useSpeechRecognition();
```

## 🎨 Material Design 3 Theme System

### Implementation Features
- **Complete MD3 Color System** - Proper surface colors and elevation
- **System Theme Detection** - Light/Dark/System preference support
- **WCAG AA Accessibility** - 15.8:1 contrast ratio for dark surfaces
- **Elevation Overlays** - Progressive lightening for depth in dark theme
- **OLED Optimization** - True black option for battery conservation
- **Smooth Transitions** - 300ms cubic-bezier theme switching

### Usage
```tsx
import { ThemeProvider, useTheme, useThemeColors } from './contexts/ThemeProvider';

// Provider setup
<ThemeProvider defaultTheme="system" enableSystem={true}>
  <App />
</ThemeProvider>

// Theme controls
const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

// Dynamic colors
const colors = useThemeColors();
<div style={{ backgroundColor: colors.surface, color: colors.onSurface }}>
  Content
</div>
```

### Component Variants
```tsx
// Enhanced Card with Material elevation
<Card variant="elevated" elevation={2} hover={true}>
  Content with proper depth
</Card>

// Material Design 3 Buttons
<Button variant="filled">Primary Action</Button>
<Button variant="outlined">Secondary Action</Button>
<Button variant="text">Text Button</Button>

// Theme Toggle Options
<ThemeToggle variant="segmented" showSystemOption={true} />
```

## 🔄 State Management

### Current Implementation
- React Context for theme
- Custom hooks for auth
- Local state for module data

### Scaling Recommendations
- Consider Zustand for complex state
- Implement React Query for server state
- Use Immer for immutable updates

## 📊 Performance Monitoring

### Metrics to Track
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s  
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5s

### Optimization Features
- Image lazy loading
- Route-based code splitting
- Vendor chunk separation
- Tree shaking enabled

## 🚀 Deployment

### Build Process
```bash
npm run build
```

### Environment Variables
```env
VITE_APP_TITLE="Libraria AI"
VITE_API_URL="your-api-url"
```

### Hosting Recommendations
- **Vercel**: Optimal for React apps
- **Netlify**: Great for static hosting
- **AWS Amplify**: Full-stack applications
- **Firebase Hosting**: Google ecosystem integration

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Follow TypeScript conventions
3. Add proper error handling
4. Include accessibility features
5. Test responsive design
6. Update documentation

### Code Style
- Use Prettier for formatting
- Follow ESLint rules
- Write descriptive commit messages
- Include TypeScript interfaces

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Documentation**: [Link to docs]
- **Design System**: [Link to Figma/Storybook]
- **API Documentation**: [Link to API docs]
- **Issue Tracker**: [Link to issues]

---

**Built with ❤️ using React, TypeScript, and modern web technologies**