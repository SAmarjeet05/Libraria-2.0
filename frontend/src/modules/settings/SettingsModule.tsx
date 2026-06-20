import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  PaintBrushIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

interface SettingsSection {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    name: 'Profile Settings',
    icon: UserIcon,
    description: 'Manage your account information'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: BellIcon,
    description: 'Configure notification preferences'
  },
  {
    id: 'security',
    name: 'Security',
    icon: ShieldCheckIcon,
    description: 'Security and privacy settings'
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: PaintBrushIcon,
    description: 'Customize the app appearance'
  },
  {
    id: 'language',
    name: 'Language & Region',
    icon: GlobeAltIcon,
    description: 'Language and regional preferences'
  }
];

export const SettingsModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const { user, token, logout } = useAuth();
  const { theme } = useTheme();
  
  const handleDeleteAccount = async () => {
    const ok = confirm('Are you sure you want to delete your account? This action will deactivate your account.');
    if (!ok) return;
    try {
      // call backend soft-delete endpoint
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/users/me/delete', { method: 'POST', headers });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to delete account');
      }
      // clear any local auth and redirect
      try { logout(); } catch {}
      window.location.href = '/';
    } catch (e) {
      console.error('Delete account failed', e);
      alert('Failed to delete account');
    }
  };
  
  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
              <div className="space-y-4">
                <Input label="Full Name" defaultValue={user?.name || ''} />
                <Input label="Email" type="email" defaultValue={user?.email || ''} />
                <Input label="Role" defaultValue={user?.role || ''} disabled />
                <div className="flex items-center space-x-3">
                  <Button>Save Changes</Button>
                  <Button onClick={handleDeleteAccount} className="text-red-600 border border-red-200">Delete Account</Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                'Email notifications for new messages',
                'Push notifications for important updates',
                'Weekly digest emails',
                'System maintenance notifications'
              ].map((option, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{option}</span>
                  <input type="checkbox" className="rounded" defaultChecked={index < 2} />
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
            <div className="space-y-4">
              <Button variant="secondary">Change Password</Button>
              <Button variant="secondary">Enable Two-Factor Authentication</Button>
              <Button variant="secondary">View Login History</Button>
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  🔒 This is a demo environment. Security features would be fully implemented in production.
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Appearance Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current theme: {theme === 'light' ? 'Light' : 'Dark'}
                  </p>
                </div>
                <ThemeToggle />
              </div>
              <div>
                <p className="font-medium mb-2">Font Size</p>
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                  <option>Small</option>
                  <option selected>Medium</option>
                  <option>Large</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case 'language':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Language & Region</h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Language</p>
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                  <option selected>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              <div>
                <p className="font-medium mb-2">Time Zone</p>
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                  <option selected>UTC-8 (Pacific Time)</option>
                  <option>UTC-5 (Eastern Time)</option>
                  <option>UTC+0 (GMT)</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <nav className="space-y-2">
              {settingsSections.map((section, index) => {
                const IconComponent = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-l-4 border-primary-500' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">{section.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderSection()}
            </motion.div>
          </Card>
        </div>
      </div>
    </div>
  );
};