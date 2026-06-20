import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  HeartIcon,
  CogIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  ClockIcon,
  ChevronRightIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import content from '../../content/content.json';

// Mapping of main menu icons
const iconMap = {
  BookOpenIcon,
  DocumentTextIcon,
  HeartIcon,
  CogIcon,
  HomeIcon,
  UserIcon: UsersIcon
};

// Secondary menu options for each module with role-based access
const secondaryMenuMap = {
  library: {
    admin: [
      { id: 'Libraria AI', name: 'Libraria AI', icon: BookOpenIcon, path: '/app/library/libraria-ai' },
      { id: 'books', name: 'Books', icon: BookOpenIcon, path: '/app/library/books' },
      { id: 'users', name: 'Users', icon: UsersIcon, path: '/app/library/users' },
      { id: 'requests', name: 'Requests', icon: ClipboardDocumentListIcon, path: '/app/library/requests' },
      { id: 'issued-books', name: 'Issued Books', icon: ClipboardDocumentListIcon, path: '/app/library/issued-books' },
      { id: 'reports', name: 'Reports', icon: ChartBarIcon, path: '/app/library/reports' },
      { id: 'community', name: 'Community', icon: ClipboardDocumentListIcon, path: '/app/library/community' }

    ],
    user: [
      { id: 'books', name: 'Books', icon: BookOpenIcon, path: '/app/library/books' },
      { id: 'ebooks', name: 'E-Books', icon: DocumentTextIcon, path: '/app/library/ebooks' },
      { id: 'my-books', name: 'My Books', icon: ClipboardDocumentListIcon, path: '/app/library/my-books' },
      { id: 'wishlist', name: 'Wishlist', icon: ClipboardDocumentListIcon, path: '/app/library/wishlist' },
      { id: 'community', name: 'Community', icon: ClipboardDocumentListIcon, path: '/app/library/community' }
    ]
  },
  notes: {
    admin: [
      { id: 'ai-tools', name: 'Notes AI', icon: CogIcon, path: '/app/notes/admin/ai-tools' },
      { id: 'rejected', name: 'Notes Approval', icon: DocumentDuplicateIcon, path: '/app/notes/admin/rejected' },
      { id: 'reported', name: 'Reported Notes', icon: ClipboardDocumentListIcon, path: '/app/notes/admin/reported' },
      // { id: 'faculty', name: 'Faculty Notes Manager', icon: UserGroupIcon, path: '/app/notes/admin/faculty' },
      { id: 'analytics', name: 'Notes Analytics', icon: ChartBarIcon, path: '/app/notes/admin/analytics' }
    ],
    user: [
      { id: 'all', name: 'All Notes', icon: DocumentDuplicateIcon, path: '/app/notes/all' },
      { id: 'my-uploads', name: 'My Uploads', icon: DocumentTextIcon, path: '/app/notes/my-uploads' },
      { id: 'my-reports', name: 'My Reports', icon: DocumentTextIcon, path: '/app/notes/my-reports' },
      { id: 'recent', name: 'Recent', icon: ClockIcon, path: '/app/notes/downloads' }
    ]
  },
  settings: [
    { id: 'profile', name: 'Profile', icon: UsersIcon, path: '/app/settings/profile' },
    { id: 'preferences', name: 'Preferences', icon: CogIcon, path: '/app/settings/preferences' }
  ]
};

export const AppShell: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('libraria_activeModule');
      return saved || null;
    } catch (e) {
      return null;
    }
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const defaultModules = [
    { id: 'home', name: 'Activity', path: '/app/home', icon: 'UserIcon', description: 'User Profile', allowedRoles: ['User', 'Admin'] },
  ];
  const modules = [
    ...content.app.modules.slice(0, 2).filter(module => 
      module.allowedRoles.some(role => hasRole(role as 'User' | 'Admin'))
    ),
    ...defaultModules,
    ...content.app.modules.slice(2).filter(module => 
      module.allowedRoles.some(role => hasRole(role as 'User' | 'Admin'))
    )
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navigate = useNavigate();

  const handleModuleClick = (moduleId: string, modulePath?: string) => {
    if (moduleId === 'home') {
      setActiveModule(null);
      try { localStorage.removeItem('libraria_activeModule'); } catch (e) {}
      if (modulePath) navigate(modulePath);
    } else {
      setActiveModule(moduleId);
      try { localStorage.setItem('libraria_activeModule', moduleId); } catch (e) {}
      if (modulePath) navigate(modulePath);
    }
  };

  // If there's no saved active module, derive it from the current pathname
  useEffect(() => {
    if (activeModule) return;
    const fromPath = modules.find(m => m.id !== 'home' && location.pathname.startsWith(m.path));
    if (fromPath) setActiveModule(fromPath.id);
  }, [location.pathname, activeModule]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getMenuItemsForModule = (moduleId?: string) => {
    if (!moduleId) return [];
    const entry = secondaryMenuMap[moduleId as keyof typeof secondaryMenuMap] as any;
    if (!entry) return [];
    if (Array.isArray(entry)) return entry;
    if (entry.admin && entry.user) {
      return hasRole('Admin') ? entry.admin : entry.user;
    }
    return [];
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Primary Sidebar - Static width */}
      <div className="w-20 flex-shrink-0">
        <aside className="fixed top-0 left-0 h-full w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4" style={{ zIndex: 999999998 }}>
          {/* Logo */}
          <Link 
            to="/app"
            onClick={() => setActiveModule(null)}
            className="p-3 mb-8"
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              L
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="flex-1 w-full px-2 space-y-2">
            {modules.map((module) => {
              const IconComponent = iconMap[module.icon as keyof typeof iconMap];
              const isActive = module.id === activeModule || 
                (module.id === 'home' && !activeModule) ||
                (module.id !== 'home' && location.pathname.startsWith(module.path));
              
              return (
                <Link
                  key={module.id}
                  to={module.path}
                  onClick={() => handleModuleClick(module.id, module.path)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-lg menu-item-smooth state-transition
                    ${isActive 
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  title={module.name}
                >
                  <IconComponent className={`w-6 h-6 transition-all ${isActive ? 'icon-scale' : ''}`} />
                  <span className="text-xs mt-1 font-medium">{module.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Profile Menu */}
          <div className="relative w-full flex justify-center mt-auto" style={{ position: 'relative', zIndex: 999999999 }} ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full ${hasRole('Admin') ? 'bg-green-400' : 'bg-cyan-500'} flex items-center justify-center`}>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user?.name?.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              </div>
            </button>

            {/* Profile Popup Menu */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20, y: 340, width: 0 }}
                  animate={{ opacity: 1, width: 300 }}
                  exit={{ opacity: 0, x: -20, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-4 left-20 ml-2 w-[300px] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  style={{ 
                    zIndex: 999999999,
                  }}
                >
                  {/* Profile Header */}
                  <div className="p-4 flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full ${hasRole('Admin') ? 'bg-green-400' : 'bg-cyan-500'} flex items-center justify-center`}>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {user?.name?.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user?.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>

                  {/* Menu Items */}
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <Link
                      to="/app/settings/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center">
                        <UsersIcon className="w-5 h-5 mr-3" />
                        <span>My Account</span>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </Link>

                    <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center">
                        <CogIcon className="w-5 h-5 mr-3" />
                        <span>Theme</span>
                      </div>
                      <ThemeToggle variant="dropdown" size="sm" />
                    </div>

                    <Link
                      to="#"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <ShareIcon className="w-5 h-5 mr-3" />
                      <span>Share with a friend</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                      <span>Log out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>

      {/* Content Area with Secondary Sidebar */}
      <div className="flex flex-1">
        {/* Secondary Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: activeModule ? 280 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0"
          style={{ height: '100vh' }}
        >
          <div className="fixed top-0 left-20 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" style={{ width: activeModule ? '280px' : '0', zIndex: 999999997 }}>
            {activeModule && (
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-6 dark:text-white">{modules.find(m => m.id === activeModule)?.name}</h2>
                {/* Search Bar */}
                <div className="relative mb-6">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <nav className="space-y-2">
                  {getMenuItemsForModule(activeModule).map((item: any) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`
                          flex items-center space-x-3 px-4 py-3 rounded-lg menu-item-smooth state-transition
                          ${isActive 
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-md' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <item.icon className={`w-5 h-5 transition-all ${isActive ? 'animate-scale-in' : ''}`} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </motion.div>

  {/* Main Content */}
  <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-w-0">

          <div className="p-6">
            <h1 className="text-xl font-semibold mb-6">
              
            </h1>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Mic
      <FloatingMic /> */}
    </div>
  );
};