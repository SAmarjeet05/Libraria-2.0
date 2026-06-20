import React, { useState, Suspense, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  UsersIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { BooksView } from './views/BooksView';
import { UsersView } from './views/UsersView';
import { ReportsView } from './views/ReportsView';
import { RequestsView } from './views/RequestsView';

const moduleItems = [
  { id: 'books', name: 'Books', icon: BookOpenIcon, description: 'Manage library catalog' },
  { id: 'users', name: 'Users', icon: UsersIcon, description: 'Manage library members' },
  { id: 'reports', name: 'Reports', icon: ChartBarIcon, description: 'View analytics' },
  { id: 'issued', name: 'Issue Services', icon: ClipboardDocumentListIcon, description: 'Track borrowed items' },
  { id: 'ebooks', name: 'eBooks', icon: ComputerDesktopIcon, description: 'Digital collection' },
  { id: 'automation', name: 'Automation', icon: Cog6ToothIcon, description: 'Automated workflows' }
];

const LibraryDashboard: React.FC = () => {
  const [selectedView, setSelectedView] = useState<string | null>(null);

  if (selectedView) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Button onClick={() => setSelectedView(null)} variant="ghost">
            ← Back to Library Dashboard
          </Button>
        </div>
        
        {selectedView === 'books' && <BooksView />}
        {selectedView === 'users' && <UsersView />}
        {selectedView === 'reports' && <ReportsView />}
        {selectedView === 'issued' && (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-amber-200">Issue Services</h3>
            <p className="text-gray-600 dark:text-amber-100">Track and manage borrowed books</p>
          </div>
        )}
        {selectedView === 'ebooks' && (
          <div className="text-center py-12">
            <ComputerDesktopIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-amber-200">Digital Collection</h3>
            <p className="text-gray-600 dark:text-amber-100">Manage eBooks and digital resources</p>
          </div>
        )}
        {selectedView === 'automation' && (
          <div className="text-center py-12">
            <Cog6ToothIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-amber-200">Automation</h3>
            <p className="text-gray-600 dark:text-amber-100">Configure automated workflows</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-300 dark:to-yellow-300 dark:bg-clip-text">Library Management</h1>
        <p className="text-gray-600 dark:text-amber-200">
          Comprehensive tools for managing your library operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moduleItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedView(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedView(item.id);
                }
              }}
              className="cursor-pointer"
            >
              <Card 
                hover 
                className="h-full"
              >
                <div className="text-center">
                  <IconComponent className="w-12 h-12 mx-auto mb-4 text-primary-600" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-amber-100">{item.name}</h3>
                  <p className="text-gray-600 dark:text-amber-200 text-sm">
                    {item.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const WelcomeCard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('Admin');
  const [quote, setQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const uid = user?.id ? String(user.id) : null;

    const load = async () => {
      setLoading(true);
      try {
        // Try sessionStorage first (prefetched on login)
        if (uid) {
          const cached = sessionStorage.getItem(`libraria_welcome_quote_${uid}`);
          if (cached) {
            if (mounted) setQuote(cached);
            setLoading(false);
            return;
          }
        }

        const res = await fetch('/api/ai/welcome');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const j = await res.json();
        const q = j.quote || j;
        if (mounted) setQuote(q);
        if (uid) {
          try { sessionStorage.setItem(`libraria_welcome_quote_${uid}`, q); } catch (e) { /* ignore */ }
        }
      } catch (e: any) {
        if (mounted) setError('Could not generate quote.');
        console.warn('Welcome quote generation failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="space-y-12">
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-3xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-300 dark:to-yellow-300 dark:bg-clip-text">Welcome to the Library{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h2>
          <p className="text-gray-600 dark:text-amber-100 mb-4">A place for discovery, learning and growth.</p>
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded mb-4">
            {loading ? (
              <div className="text-sm text-gray-500">Generating a short inspirational quote...</div>
            ) : error ? (
              <div className="text-sm text-red-500">{error}</div>
            ) : (
              <blockquote className="text-lg italic text-gray-800 dark:text-amber-50">{quote || 'Welcome to the library — where every page opens a new world.'}</blockquote>
            )}
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="books">
              <Button>Browse Books</Button>
            </Link>
            <Link to="community">
              <Button variant="ghost">Community</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended Books Section - Only show to non-admin users */}
      {!isAdmin && (
        <div className="px-6 py-4">
          <RecommendedBooksSection />
        </div>
      )}
    </div>
  );
};

import { EBooksView } from './views/EBooksView';
import { MyBooksView } from './views/MyBooksView';
import { IssuedBooksView } from './views/IssuedBooksView';
import { WishlistView } from './views/WishlistView';
import { CommunityView } from './views/CommunityView';
import { LibrariaAIView } from './views/LibrariaAIView';
import { RecommendedBooksSection } from './components/RecommendedBooksSection';

export const LibraryModule: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Admin');

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    }>
      <Routes>
  <Route index element={<WelcomeCard />} />
        <Route path="books" element={<BooksView />} />
        {/* Routes available to all users */}
        <Route path="community" element={<CommunityView />} />

        {isAdmin ? (
          <>
            <Route path="libraria-ai" element={<LibrariaAIView />} />
            <Route path="users" element={<UsersView />} />
            <Route path="requests" element={<RequestsView />} />
            <Route path="issued-books" element={<IssuedBooksView />} />
            <Route path="reports" element={<ReportsView />} />
          </>
        ) : (
          <>
            <Route path="ebooks" element={<EBooksView />} />
            <Route path="my-books" element={<MyBooksView />} />
            <Route path="wishlist" element={<WishlistView />} />
          </>
        )}
        <Route path="*" element={<LibraryDashboard />} />
      </Routes>
    </Suspense>
  );
};