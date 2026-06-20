import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FlagIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { ParticleSystem, Animated3DHeader } from '../../../components/3d';
import { useAuth } from '../../../hooks/useAuth';

type UserReport = {
  report_id: number | string;
  note_id: number | string;
  title?: string | null;
  reason?: string | null;
  status?: string | null;
  admin_response?: string | null;
  created_at?: string | null;
};

const UserReportResponsesPage: React.FC = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let authToken = token;
      if (!authToken) {
        try {
          const saved = localStorage.getItem('libraria_auth');
          if (saved) {
            const parsed = JSON.parse(saved as string);
            authToken = parsed?.token || parsed?.access_token || null;
          }
        } catch (e) {}
      }

      const res = await fetch('/api/notes/reports/my', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
      }

      const j = await res.json();
      setReports(j || []);
    } catch (err: any) {
      console.error('Failed to load user reports', err);
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <ParticleSystem particleCount={120} color="#f97316" speed={0.001} />

      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none z-0">
            <Animated3DHeader title="My Reports" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">🚩 My Reports & Responses</h2>
              <p className="text-gray-600 dark:text-amber-200 text-sm">
                Track your submitted reports and admin responses
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        )}
        {error && <div className="p-6 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">{error}</div>}

        <div className="space-y-4 mt-6">
          {reports.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <FlagIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">No reports yet</h3>
              <p className="text-gray-600 dark:text-amber-100">You have not submitted any reports.</p>
            </motion.div>
          )}

          {reports.map((r, index) => (
            <motion.div
              key={String(r.report_id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-all p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                  <FlagIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-amber-100 mb-1">{r.title || `Note #${r.note_id}`}</h3>
                  <p className="text-sm text-gray-600 dark:text-amber-200 mb-1"><strong>Reason:</strong> {r.reason}</p>
                  <p className="text-xs text-gray-500 dark:text-amber-300 flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    Submitted: {r.created_at}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-amber-100">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    String(r.status || 'pending').toLowerCase() === 'resolved'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {r.status || 'pending'}
                  </span>
                </div>
                {r.admin_response ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-900/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-bold text-green-700 dark:text-green-300">Admin Response</p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-amber-100">{r.admin_response}</p>
                  </motion.div>
                ) : (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-amber-200">Awaiting admin response...</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserReportResponsesPage;
