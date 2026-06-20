import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, MagnifyingGlassIcon, EyeIcon, ArrowDownTrayIcon, FlagIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ParticleSystem, Animated3DHeader } from '../../../components/3d';
import { useAuth } from '../../../hooks/useAuth';

type HistoryRow = {
  id: string;
  note_id: string;
  title?: string | null;
  subject?: string | null;
  date?: string | null; // ISO
  action?: string | null;
};

const DownloadHistoryPage: React.FC = () => {
  const [downloads, setDownloads] = useState<HistoryRow[]>([]);
  const [search, setSearch] = useState<string>('');
  const { token } = useAuth() as any;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/notes/history', {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error('failed');
        const j = await res.json();
        setDownloads(Array.isArray(j) ? j : []);
      } catch (err) {
        console.warn('History fetch failed', err);
        setDownloads([]);
      }
    })();
  }, [token]);

  // Reduce to one entry per note_id (keep the most recent entry per note)
  const uniqueByNote = Object.values(downloads.reduce<Record<string, HistoryRow>>((acc, r) => {
    const existing = acc[r.note_id];
    if (!existing) {
      acc[r.note_id] = r;
      return acc;
    }
    // compare timestamps - prefer newer
    try {
      const existingDate = existing.date ? new Date(existing.date) : null;
      const rDate = r.date ? new Date(r.date) : null;
      if (!existingDate && rDate) acc[r.note_id] = r;
      else if (existingDate && rDate && rDate > existingDate) acc[r.note_id] = r;
    } catch (e) {
      // fallback: keep existing
    }
    return acc;
  }, {}));

  const filtered = uniqueByNote.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    const title = String(d.title || '').toLowerCase();
    const subject = String(d.subject || '').toLowerCase();
    const action = String(d.action || '').toLowerCase();
    const date = String(d.date || '').toLowerCase();
    return title.includes(q) || subject.includes(q) || action.includes(q) || date.includes(q);
  });

  const [reportOpenNoteId, setReportOpenNoteId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);

  const openReport = (noteId: string) => {
    setReportOpenNoteId(noteId);
    setReportReason('');
  };

  const submitReport = async (noteId: string) => {
    if (!reportReason.trim()) {
      alert('Please enter a reason');
      return;
    }
    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason: reportReason })
      });
      if (!res.ok) throw new Error('report failed');
      alert('Report submitted');
      setReportOpenNoteId(null);
    } catch (err) {
      console.error('Report error', err);
      alert('Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <ParticleSystem particleCount={120} color="#f97316" speed={0.001} />

      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none z-0">
            <Animated3DHeader title="Download History" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">🕒 Download / View History</h2>
              <p className="text-gray-600 dark:text-amber-200 text-sm">
                Track your study materials access history
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400" />
            <Input
              placeholder="Search history (title, subject, action, date)"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50 transition-all"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-lg"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-700">
                <tr>
                  <th className="p-4 text-left font-bold text-orange-600 dark:text-orange-400">Note Title</th>
                  <th className="p-4 text-left font-bold text-orange-600 dark:text-orange-400">Date/Time</th>
                  <th className="p-4 text-left font-bold text-orange-600 dark:text-orange-400">Subject</th>
                  <th className="p-4 text-left font-bold text-orange-600 dark:text-orange-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, index) => (
                  <motion.tr
                    key={d.id || `${d.note_id}_${d.date}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <ClockIcon className="w-5 h-5 text-orange-500" />
                        <span className="font-semibold text-gray-900 dark:text-amber-100">{d.title || `#${d.note_id}`}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-amber-200">{d.date ? new Date(d.date).toLocaleString() : '-'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold">
                        {d.subject || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 items-start">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.open(`/api/notes/${d.note_id}/view`, '_blank')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Open
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.open(`/api/notes/${d.note_id}/download`, '_blank')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Download
                        </motion.button>
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openReport(d.note_id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium transition-all"
                          >
                            <FlagIcon className="w-4 h-4" />
                            Report
                          </motion.button>
                          {reportOpenNoteId === d.note_id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-900/50 rounded-xl shadow-2xl p-4 z-50"
                            >
                              <label className="block text-sm font-semibold text-gray-700 dark:text-amber-100 mb-2">Reason</label>
                              <textarea
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-amber-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50"
                                rows={3}
                              />
                              <div className="mt-3 flex gap-2 justify-end">
                                <button
                                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all"
                                  onClick={() => setReportOpenNoteId(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                                  onClick={() => submitReport(d.note_id)}
                                  disabled={reportSubmitting}
                                >
                                  {reportSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <ClockIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">No matching history</h3>
                        <p className="text-gray-600 dark:text-amber-100">Your access history will appear here</p>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DownloadHistoryPage;
