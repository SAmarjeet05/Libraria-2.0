import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpenIcon, CloudArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ParticleSystem, Animated3DHeader } from '../../components/3d';
import { useAuth } from '../../hooks/useAuth';

import { AllNotesPage } from './pages/AllNotesPage';
import { NoteViewPage } from './pages/NoteViewPage';
import { UploadNotesPage } from './pages/UploadNotesPage';
import { MyUploadedNotesPage } from './pages/MyUploadedNotesPage';
import UserReportResponsesPage from './pages/UserReportResponsesPage';
import DownloadHistoryPage from './pages/recentHistoryPage';
import { RecommendedNotesPage } from './pages/RecommendedNotesPage';

import PendingNotesReview from './admin/PendingNotesReview';
import ApprovedNotesPage from './admin/ApprovedNotesPage';
import RejectedNotesPage from './admin/NotesApprovalPage';
import NotesAnalyticsDashboard from './admin/NotesAnalyticsDashboard';
import ManageTagsSubjects from './admin/ManageTagsSubjects';
import FacultyNotesManager from './admin/FacultyNotesManager';
import ReportedNotesPage from './admin/ReportedNotesPage';
import AIToolsAdmin from './admin/AIToolsAdmin';
import { RecommendedNotesSection } from './components/RecommendedNotesSection';
import { RecommendedVideosSection } from '../../components/RecommendedVideosSection';

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
        // Try module-specific sessionStorage first (prefetched at login)
        if (uid) {
          const cached = sessionStorage.getItem(`libraria_welcome_notes_${uid}`);
          if (cached) {
            if (mounted) setQuote(cached);
            setLoading(false);
            return;
          }
        }

        // Request a notes-specific welcome from the AI endpoint. Backend should use llama3:8b at login.
        const res = await fetch('/api/ai/welcome?module=notes');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const j = await res.json();
        const q = j.quote || j;
        if (mounted) setQuote(q);
        if (uid) {
          try { sessionStorage.setItem(`libraria_welcome_notes_${uid}`, q); } catch (e) { /* ignore */ }
        }
      } catch (e: any) {
        if (mounted) setError('Could not generate notes welcome.');
        console.warn('Notes welcome generation failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <ParticleSystem particleCount={120} color="#f97316" speed={0.001} />

      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none z-0">
            <Animated3DHeader title="Notes Hub" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">📚 Welcome to Notes{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h2>
              <p className="text-gray-600 dark:text-amber-200 text-sm">
                Your hub for study notes and shared resources
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-2xl p-8">
            <div className="mb-6 p-8 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-gray-700 dark:via-gray-700 dark:to-gray-700 rounded-xl border-2 border-orange-200 dark:border-orange-900/50">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-amber-200">Generating your personalized welcome...</span>
                </div>
              ) : error ? (
                <div className="text-center py-6">
                  <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              ) : (
                <motion.blockquote
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-medium italic text-gray-800 dark:text-amber-100 text-center leading-relaxed"
                >
                  "{quote || 'Welcome to Notes — share knowledge and learn together.'}"
                </motion.blockquote>
              )}
            </div>
            <div className="flex items-center justify-center gap-4">
              <Link to="all">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <BookOpenIcon className="w-5 h-5" />
                  Browse Notes
                </motion.button>
              </Link>
              <Link to="upload">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Upload Note
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Recommended Notes Section - Only show to non-admin users */}
        {!isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <RecommendedNotesSection />
          </motion.div>
        )}

        {/* Recommended Videos Section - Only show to non-admin users */}
        {!isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RecommendedVideosSection />
          </motion.div>
        )}
      </div>
    </div>
  );
};

const NotesDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-300 dark:to-yellow-300 dark:bg-clip-text">Notes Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-amber-200">Manage Notes</h3>
          <p className="text-sm text-gray-600">View and moderate uploaded notes.</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-amber-200">Reports & Analytics</h3>
          <p className="text-sm text-gray-600">Review download and usage statistics.</p>
        </Card>
      </div>
    </div>
  );
};

export const NotesModule: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Admin');

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <Routes>
        <Route index element={<WelcomeCard />} />
        <Route path="note/:noteId" element={<NoteViewPage />} />

        {isAdmin ? (
          <>
            <Route path="admin/pending" element={<PendingNotesReview />} />
            <Route path="admin/approved" element={<ApprovedNotesPage />} />
            <Route path="admin/rejected" element={<RejectedNotesPage />} />
            <Route path="admin/analytics" element={<NotesAnalyticsDashboard />} />
            <Route path="admin/manage" element={<ManageTagsSubjects />} />
            <Route path="admin/faculty" element={<FacultyNotesManager />} />
            <Route path="admin/reported" element={<ReportedNotesPage />} />
            <Route path="admin/ai-tools" element={<AIToolsAdmin />} />
          </>
        ) : (
          <>
            <Route path="all" element={<AllNotesPage />} />
            <Route path="upload" element={<UploadNotesPage />} />
            <Route path="my-uploads" element={<MyUploadedNotesPage />} />
            <Route path="my-reports" element={<UserReportResponsesPage />} />
            <Route path="downloads" element={<DownloadHistoryPage />} />
            <Route path="recommended" element={<RecommendedNotesPage />} />
          </>
        )}

        <Route path="*" element={<NotesDashboard />} />
      </Routes>
    </Suspense>
  );
};

export default NotesModule;
