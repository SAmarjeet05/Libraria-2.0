import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';

export const ProfileView: React.FC = () => {
  const { user, token, logout } = useAuth() as any;

  const handleDeleteAccount = async () => {
    const ok = confirm('Are you sure you want to delete your account? This action will deactivate your account.');
    if (!ok) return;
    try {
      const res = await fetch('/api/users/me/delete', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to delete account');
      }
      // logout locally and redirect to homepage
      logout();
      window.location.href = '/';
    } catch (e) {
      console.error('Delete account failed', e);
      alert('Failed to delete account');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-semibold mb-4">Profile Settings</h2>
        <p className="mb-6">Manage your account information and preferences.</p>

        <div className="space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white ${
              user?.role === 'Admin' ? 'bg-green-500' : 'bg-cyan-500'
            }`}>
              {user?.name?.split(' ').map((part: string) => part[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h3 className="font-semibold">{user?.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.role}</p>
            </div>
          </div>

          <div className="grid gap-6 max-w-xl">
            <Input
              label="Full Name"
              defaultValue={user?.name}
              placeholder="Enter your full name"
            />
            
            <Input
              label="Email Address"
              type="email"
              defaultValue={user?.email}
              placeholder="Enter your email"
            />

            <Input
              label="Role"
              defaultValue={user?.role}
              disabled
            />

            <div className="pt-4">
              <Button>Save Changes</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Security Section */}
      <Card>
        <h3 className="text-xl font-semibold mb-4">Security</h3>
        <div className="space-y-4">
          <Button variant="secondary">Change Password</Button>
          <Button variant="secondary">Enable Two-Factor Authentication</Button>
          <div className="pt-2">
            <Button onClick={handleDeleteAccount} className="text-red-600 border border-red-200">Delete Account</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};