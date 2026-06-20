// Adjusted secondary menu options with role-based access
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
  FolderIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const secondaryMenuMap = {
  library: {
    admin: [
      { id: 'books', name: 'Books', icon: BookOpenIcon, path: '/app/library/books' },
      { id: 'users', name: 'Users', icon: UsersIcon, path: '/app/library/users' },
      { id: 'issued-books', name: 'Issued Books', icon: ClipboardDocumentListIcon, path: '/app/library/issued-books' },
      { id: 'reports', name: 'Reports', icon: ChartBarIcon, path: '/app/library/reports' }
    ],
    user: [
      { id: 'books', name: 'Books', icon: BookOpenIcon, path: '/app/library/books' },
      { id: 'ebooks', name: 'E-Books', icon: DocumentTextIcon, path: '/app/library/ebooks' },
      { id: 'my-books', name: 'My Books', icon: ClipboardDocumentListIcon, path: '/app/library/my-books' }
    ]
  },
  notes: [
    { id: 'all', name: 'All Notes', icon: DocumentDuplicateIcon, path: '/app/notes' },
    { id: 'folders', name: 'Folders', icon: FolderIcon, path: '/app/notes/folders' },
    { id: 'recent', name: 'Recent', icon: ClockIcon, path: '/app/notes/recent' }
  ],
  settings: [
    { id: 'profile', name: 'Profile', icon: UsersIcon, path: '/app/settings/profile' },
    { id: 'preferences', name: 'Preferences', icon: CogIcon, path: '/app/settings/preferences' }
  ]
};