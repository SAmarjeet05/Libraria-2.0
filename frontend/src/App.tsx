import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { Landing } from './pages/Landing';
import { Home } from './pages/Home';
import { DashboardController } from './pages/DashboardController';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LibraryLoginPage } from './components/auth/LibraryLoginPage';

// Lazy load modules for code splitting
const LibraryModule = lazy(() => import('./modules/library/LibraryModule').then(m => ({ default: m.LibraryModule })));
const NotesModule = lazy(() => import('./modules/notes/NotesModule').then(m => ({ default: m.NotesModule })));
const SettingsModule = lazy(() => import('./modules/settings/SettingsModule').then(m => ({ default: m.SettingsModule })));

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-900"></div>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 absolute top-0 left-0"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl fireplace-glow">
        📚
      </div>
    </div>
  </div>
);

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-surface-light-container via-primary-50/30 to-secondary-50/30 dark:from-surface-dark-DEFAULT dark:via-surface-dark-container dark:to-surface-dark-variant">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LibraryLoginPage />} />
          
          {/* Protected App Routes */}
          <Route 
            path="/app" 
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            {/* Dashboard is the default landing page after login */}
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardController />} />
            <Route path="home" element={<Home />} />
            
            <Route 
              path="library/*" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LibraryModule />
                </Suspense>
              } 
            />
            
            <Route 
              path="notes/*" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <NotesModule />
                </Suspense>
              } 
            />
            
            <Route 
              path="settings/*" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <SettingsModule />
                </Suspense>
              } 
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem={true}>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;