import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersIcon, UserPlusIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { RoleGuard } from '../../../components/auth/RoleGuard';
import { useAuth } from '../../../hooks/useAuth';

type BackendUser = {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role?: string;
  created_at?: string;
  preferences?: any;
  borrow_count?: number;
};

export const UsersView: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    role: 'user'
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`${resp.status} ${resp.statusText}: ${txt}`);
      }
      const data = await resp.json();
      setUsers(data || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if current user is Admin
    if (currentUser && currentUser.role === 'Admin') {
      fetchUsers();
    }
  }, [token, currentUser]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">Users Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage library members and their access</p>
        </div>

        <RoleGuard requiredRole="ADMIN">
          <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
            <UserPlusIcon className="w-5 h-5" />
            <span>Add User</span>
          </Button>
        </RoleGuard>
      </div>

      <RoleGuard requiredRole="ADMIN" showFallback={true}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Input placeholder="Search by name, email or username" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} className="h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
            {loading && <div className="p-2">Loading users...</div>}
            {error && <div className="p-2 text-red-600">{error}</div>}
          </div>

          {!loading && users.length === 0 && !error && (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No users found</h3>
              <p className="text-gray-600 dark:text-gray-400">Add some users to get started</p>
            </div>
          )}

          {users
            .filter(u => {
              if (roleFilter === 'admin') return (u.role || '').toString().toLowerCase() === 'admin';
              if (roleFilter === 'user') return (u.role || '').toString().toLowerCase() !== 'admin';
              return true;
            })
            .filter(u => {
              const q = searchTerm.trim().toLowerCase();
              if (!q) return true;
              const name = (u.full_name || u.username || u.email || '').toLowerCase();
              return name.includes(q) || (u.email || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
            })
            .map((u, index) => {
              const name = u.full_name || u.username || u.email;
              const role = (u.role || 'user').toString().toLowerCase() === 'admin' ? 'Admin' : 'User';
              const joined = u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown';
              const booksIssued = typeof u.borrow_count === 'number' ? u.borrow_count : '—';

              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card hover>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{name}{role === 'Admin' ? ' — Admin' : ''}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{u.email}</p>
                          <p className="text-xs text-gray-500">Joined: {joined}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${role === 'Admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'}`}>
                          {role}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Books Issued: <strong>{booksIssued}</strong></p>
                        {role === 'Admin' && <p className="text-xs text-gray-500 mt-1">(Administrator)</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <RoleGuard requiredRole="ADMIN">
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={async () => {
                          if (!confirm(`Delete user ${name}? This cannot be undone.`)) return;
                          try {
                            const resp = await fetch(`/api/users/${u.id}/`, { method: 'DELETE', headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
                            if (!resp.ok) {
                              const txt = await resp.text();
                              throw new Error(`${resp.status} ${resp.statusText}: ${txt}`);
                            }
                            // refresh
                            await fetchUsers();
                          } catch (err: any) {
                            console.error('Failed to delete user:', err);
                            setError(err.message || 'Failed to delete user');
                          }
                        }}>Delete</Button>
                      </RoleGuard>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
        </div>
      </RoleGuard>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center ml-64 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-lg"
            >
              <Card>
                <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <h3 className="text-xl font-bold">Add User</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Create a new member or admin account</p>
                  </div>
                  <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                    <XCircleIcon className="w-6 h-6" />
                  </Button>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input type="email" value={newUser.email} onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <Input type="text" value={newUser.username} onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Full name</label>
                    <Input type="text" value={newUser.full_name} onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <Input type="password" value={newUser.password} onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select value={newUser.role} onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))} className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50">
                  <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button disabled={submitting} className="bg-primary-600 text-white" onClick={async () => {
                    try {
                      setSubmitting(true);
                      setError(null);
                      const resp = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({
                          email: newUser.email,
                          username: newUser.username,
                          password: newUser.password,
                          full_name: newUser.full_name,
                          role: newUser.role
                        })
                      });
                      if (!resp.ok) {
                        const txt = await resp.text();
                        throw new Error(`${resp.status} ${resp.statusText}: ${txt}`);
                      }
                      // registration returns token + user; ignore token, refresh list
                      await resp.json();
                      setShowAddModal(false);
                      setNewUser({ email: '', username: '', full_name: '', password: '', role: 'user' });
                      // refresh users
                      await fetchUsers();
                    } catch (err: any) {
                      console.error('Failed to create user:', err);
                      setError(err.message || 'Failed to create user');
                    } finally {
                      setSubmitting(false);
                    }
                  }}>{submitting ? 'Creating...' : 'Create User'}</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};