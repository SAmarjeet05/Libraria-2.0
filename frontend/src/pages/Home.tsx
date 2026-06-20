import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleSystem, Animated3DHeader } from '../components/3d';
import { 
  BookOpenIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  SparklesIcon,
  ChartBarIcon,
  FireIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';

type BorrowRecord = {
  id: string;
  book_id: string;
  user_id: string;
  status: string;
  borrowed_at?: string;
  due_date?: string;
};

type EbookIssue = {
  id: string;
  ebook_id: string;
  user_id: string;
  issued_at?: string;
  revoked_at?: string | null;
};

const formatTime = (t?: string | null) => {
  if (!t) return '';
  try {
    return new Date(t).toLocaleString();
  } catch (e) {
    return String(t);
  }
};

const shortId = (s?: string | null) => {
  if (!s) return '';
  if (s.length <= 10) return s;
  return `${s.slice(0, 8)}..${s.slice(-4)}`;
};

export const Home: React.FC = () => {
  const { user, token } = useAuth() as any;
  const [profile, setProfile] = useState<any>(user || null);
  // small profile loader state; not strictly required for UI but kept minimal

  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [ebooks, setEbooks] = useState<EbookIssue[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // fetch fresh profile using token if available
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const j = await res.json();
        setProfile(j);
      } catch (e) {
        // ignore profile fetch errors for now
      }
    };
    fetchProfile();
  }, [token]);

  useEffect(() => {
    // fetch recent activity (borrows + ebook issues)
    const fetchActivity = async () => {
      if (!token || !profile?.id) return;
      setLoadingActivity(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [bRes, eRes] = await Promise.all([
          fetch(`/api/borrows/user/${profile.id}`, { headers }),
          fetch(`/api/ebook_issues/user/${profile.id}`, { headers })
        ]);

        if (bRes.ok) setBorrows(await bRes.json());
        if (eRes.ok) setEbooks(await eRes.json());
      } catch (e) {
        // ignore individual errors for now
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchActivity();
  }, [token, profile?.id]);

  const activityItems: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    time?: string | null;
    details: any;
  }> = [
    // map borrows
    ...borrows.map(b => ({
      id: `borrow-${b.id}`,
      type: 'borrow',
      title: `Borrowed ${shortId(b.book_id)}`,
      subtitle: `Status: ${b.status}`,
      time: b.borrowed_at || b.due_date || null,
      details: b as any
    })),
    // map ebook issues
    ...ebooks.map(e => ({
      id: `ebook-${e.id}`,
      type: 'ebook',
      title: `Ebook ${shortId(e.ebook_id)}`,
      subtitle: e.revoked_at ? 'Revoked' : 'Active',
      time: e.issued_at || null,
      details: e as any
    }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* 3D Particle Background */}
      <ParticleSystem particleCount={120} color="#f97316" speed={0.001} />

      <div className="space-y-8 relative z-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8 text-white shadow-2xl"
      >
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 mb-4"
          >
            <SparklesIcon className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wider opacity-90">Welcome Back</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black mb-3 drop-shadow-lg"
          >
            {profile?.full_name || profile?.username || 'User'}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg opacity-90 max-w-2xl"
          >
            {profile?.is_admin ? '👑 Admin Dashboard' : '📚 Your Learning Hub'}
          </motion.p>
        </div>
      </motion.div>

      {/* User Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0"
            >
              {profile?.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.full_name || profile.username} 
                  className="w-24 h-24 rounded-2xl shadow-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">
                    {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </motion.div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold">{profile?.full_name || profile?.username}</h2>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                </motion.div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">{profile?.email || 'No email provided'}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Role</p>
                  <p className="text-lg font-bold mt-1">{profile?.role || (profile?.is_admin ? 'Admin' : 'User')}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Member Since</p>
                  <p className="text-lg font-bold mt-1">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Status</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">Active</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Activities</p>
                  <p className="text-lg font-bold mt-1">{activityItems.length}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          { icon: BookOpenIcon, label: 'Books Borrowed', value: borrows.length, color: 'from-orange-500 to-red-500' },
          { icon: DocumentTextIcon, label: 'Ebooks Issued', value: ebooks.length, color: 'from-red-500 to-pink-500' },
          { icon: UserGroupIcon, label: 'Recent Actions', value: activityItems.length, color: 'from-pink-500 to-rose-500' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              className="group relative overflow-hidden"
            >
              <Card className="p-6 h-full relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-4xl font-bold mt-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent"
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} text-white`}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Activity - Enhanced Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        {/* Activity Header with Stats */}
        <Card className="p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500/10 to-orange-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 dark:from-orange-400 dark:via-red-400 dark:to-pink-400 bg-clip-text text-transparent">
                Activity Overview
              </h3>
            </motion.div>

            {/* Activity Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50 dark:border-blue-800/50"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Activities</p>
                <p className="text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">{activityItems.length}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-200/50 dark:border-orange-800/50"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Books Borrowed</p>
                <p className="text-3xl font-bold mt-2 text-orange-600 dark:text-orange-400">{borrows.length}</p>
                <p className="text-xs text-gray-500 mt-1">In total</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-200/50 dark:border-red-800/50"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ebooks Issued</p>
                <p className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">{ebooks.length}</p>
                <p className="text-xs text-gray-500 mt-1">Active</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/50 dark:border-purple-800/50"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Activity Rate</p>
                <p className="text-3xl font-bold mt-2 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <ArrowUpIcon className="w-5 h-5" />
                  {activityItems.length > 0 ? '↑' : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </motion.div>
            </div>

            {/* Activity Type Distribution Chart */}
            {activityItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50"
              >
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Activity Distribution</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Book Borrows</span>
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{Math.round((borrows.length / Math.max(activityItems.length, 1)) * 100)}%</span>
                    </div>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.35, duration: 0.8 }}
                      className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden origin-left"
                    >
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                        style={{ width: `${(borrows.length / Math.max(activityItems.length, 1)) * 100}%` }}
                      />
                    </motion.div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Ebook Issues</span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">{Math.round((ebooks.length / Math.max(activityItems.length, 1)) * 100)}%</span>
                    </div>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden origin-left"
                    >
                      <div 
                        className="h-full bg-gradient-to-r from-red-400 to-pink-500"
                        style={{ width: `${(ebooks.length / Math.max(activityItems.length, 1)) * 100}%` }}
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Enhanced Activity Timeline */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold flex items-center gap-2"
            >
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
                <FireIcon className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Activity Timeline
              </span>
            </motion.h3>
            {activityItems.length > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300"
              >
                {activityItems.length} {activityItems.length === 1 ? 'action' : 'actions'}
              </motion.span>
            )}
          </div>

          {/* Activity Timeline Sparkline Graph */}
          {activityItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full mb-8 p-6 bg-gradient-to-br from-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <svg viewBox="0 0 700 120" className="w-full h-32">
                {(() => {
                  const times = activityItems
                    .map(a => (a.time ? new Date(a.time).getTime() : null))
                    .filter(Boolean) as number[];
                  if (times.length === 0) return null;
                  const min = Math.min(...times);
                  const max = Math.max(...times);
                  const w = 660;
                  const h = 80;
                  const left = 20;
                  const top = 10;
                  const norm = (t: number) => {
                    if (max === min) return left + w / 2;
                    return left + ((t - min) / (max - min)) * w;
                  };
                  const points = activityItems
                    .map(a => ({
                      x: a.time ? norm(new Date(a.time).getTime()) : null,
                      y: top + h / 2,
                      type: a.type
                    }))
                    .filter(p => p.x !== null) as any[];

                  const poly = points.map(p => `${p.x},${p.y}`).join(' ');

                  return (
                    <g>
                      <defs>
                        <linearGradient id="activity-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                          <stop offset="50%" stopColor="#ec4899" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
                        </linearGradient>
                        <linearGradient id="activity-line" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="50%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <g opacity="0.1">
                        <line x1={left} y1={top} x2={left} y2={top + h} stroke="currentColor" strokeWidth={1} />
                        <line x1={left + w / 3} y1={top} x2={left + w / 3} y2={top + h} stroke="currentColor" strokeWidth={1} />
                        <line x1={left + (w * 2) / 3} y1={top} x2={left + (w * 2) / 3} y2={top + h} stroke="currentColor" strokeWidth={1} />
                        <line x1={left + w} y1={top} x2={left + w} y2={top + h} stroke="currentColor" strokeWidth={1} />
                      </g>
                      {/* Filled area under line */}
                      <defs>
                        <linearGradient id="area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polyline points={poly} fill="url(#area-grad)" stroke="url(#activity-grad)" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                      <polyline points={poly} fill="none" stroke="url(#activity-line)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      {/* Data points */}
                      {points.map((p, i) => {
                        const color = p.type === 'borrow' ? '#f97316' : p.type === 'ebook' ? '#ef4444' : '#ec4899';
                        return (
                          <g key={`pt-${i}`}>
                            <motion.circle
                              cx={p.x}
                              cy={p.y}
                              r={6}
                              fill="white"
                              stroke={color}
                              strokeWidth={3}
                              className="cursor-pointer"
                              whileHover={{ r: 10 }}
                              onClick={() => {
                                const id = activityItems[i].id;
                                setExpandedId(expandedId === id ? null : id);
                                const el = document.getElementById(id);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                            />
                            <motion.circle
                              cx={p.x}
                              cy={p.y}
                              r={3}
                              fill={color}
                              whileHover={{ r: 4 }}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </motion.div>
          )}

          {/* Activity List */}
          {loadingActivity && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block"
              >
                <ChartBarIcon className="w-8 h-8 text-primary-600" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400 mt-3">Loading activity...</p>
            </motion.div>
          )}

          {!loadingActivity && activityItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <ClockIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
            </motion.div>
          )}

          <AnimatePresence>
            {activityItems.length > 0 && (
              <motion.div className="space-y-4">
                {activityItems.map((item, idx) => {
                  const first = idx === 0;
                  const last = idx === activityItems.length - 1;
                  const isExpanded = expandedId === item.id;
                  
                  const getIcon = () => {
                    if (item.type === 'borrow') return BookOpenIcon;
                    if (item.type === 'ebook') return DocumentTextIcon;
                    return CheckCircleIcon;
                  };
                  
                  const getColors = () => {
                    if (item.type === 'borrow') return {
                      gradient: 'from-orange-500 to-red-500',
                      bg: 'from-orange-500/10 to-red-500/10',
                      border: 'border-l-orange-500',
                      text: 'text-orange-600 dark:text-orange-400',
                      light: 'text-orange-600'
                    };
                    if (item.type === 'ebook') return {
                      gradient: 'from-red-500 to-pink-500',
                      bg: 'from-red-500/10 to-pink-500/10',
                      border: 'border-l-red-500',
                      text: 'text-red-600 dark:text-red-400',
                      light: 'text-red-600'
                    };
                    return {
                      gradient: 'from-purple-500 to-pink-500',
                      bg: 'from-purple-500/10 to-pink-500/10',
                      border: 'border-l-purple-500',
                      text: 'text-purple-600 dark:text-purple-400',
                      light: 'text-purple-600'
                    };
                  };

                  const colors = getColors();
                  const IconComponent = getIcon();
                  
                  return (
                    <motion.div
                      key={item.id}
                      id={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-4"
                    >
                      {/* Timeline */}
                      <div className="flex flex-col items-center gap-2 pt-1">
                        {!first && <div className="w-1 h-4 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600" />}
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-gray-800`}
                        >
                          <IconComponent className="w-6 h-6" />
                        </motion.div>
                        {!last && <div className="w-1 flex-1 min-h-24 bg-gradient-to-b from-transparent to-gray-300 dark:to-gray-600" />}
                      </div>

                      {/* Content Card */}
                      <motion.div
                        className="flex-1 mt-0"
                        whileHover={{ scale: 1.01 }}
                      >
                        <Card
                          className={`p-5 cursor-pointer border-l-4 overflow-hidden relative group ${colors.border} bg-gradient-to-br ${colors.bg} border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300`}
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full blur-2xl`} />
                          </div>

                          <div className="relative z-10 flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-bold text-lg ${colors.text}`}>{item.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.subtitle}</p>
                              {item.time && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  {formatTime(item.time)}
                                </p>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(isExpanded ? null : item.id);
                              }}
                              className={`ml-4 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                                isExpanded 
                                  ? `bg-gradient-to-r ${colors.gradient} text-white` 
                                  : `${colors.text} hover:bg-gray-100 dark:hover:bg-gray-900/50`
                              }`}
                            >
                              {isExpanded ? '↑ Hide' : '↓ Details'}
                            </motion.button>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-4"
                              >
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50"
                                  >
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase">Type</p>
                                    <p className={`font-bold capitalize mt-1 ${colors.text}`}>{item.type}</p>
                                  </motion.div>

                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50"
                                  >
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase">ID</p>
                                    <p className="font-mono text-sm text-gray-900 dark:text-white mt-1">{shortId(item.details.id || item.details.book_id || item.details.ebook_id)}</p>
                                  </motion.div>

                                  {item.details.due_date && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.2 }}
                                      className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50"
                                    >
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase flex items-center gap-1">
                                        <CalendarIcon className="w-3 h-3" /> Due Date
                                      </p>
                                      <p className="text-sm text-gray-900 dark:text-white mt-1">{formatTime(item.details.due_date)}</p>
                                    </motion.div>
                                  )}

                                  {item.details.status && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.25 }}
                                      className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50"
                                    >
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase flex items-center gap-1">
                                        <CheckCircleIcon className="w-3 h-3" /> Status
                                      </p>
                                      <p className={`font-bold capitalize mt-1 ${colors.text}`}>{item.details.status}</p>
                                    </motion.div>
                                  )}

                                  {item.details.revoked_at && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.3 }}
                                      className="p-3 rounded-lg bg-red-500/10"
                                    >
                                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">Revoked</p>
                                      <p className="text-sm text-red-700 dark:text-red-300 font-semibold mt-1">{formatTime(item.details.revoked_at)}</p>
                                    </motion.div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                  {item.type === 'borrow' && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                      <BookOpenIcon className="w-4 h-4" />
                                      View Borrow Details
                                    </motion.button>
                                  )}
                                  {item.type === 'ebook' && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                      <DocumentTextIcon className="w-4 h-4" />
                                      Open Ebook
                                    </motion.button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
      </div>
    </div>
  );
};