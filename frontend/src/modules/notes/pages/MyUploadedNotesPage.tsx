import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DocumentTextIcon, TrashIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ParticleSystem, Animated3DHeader } from '../../../components/3d';
import FileViewer from '../../../components/FileViewer';
import { useAuth } from '../../../hooks/useAuth';

export const MyUploadedNotesPage: React.FC = () => {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth() as any;
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewType, setPreviewType] = useState<string>('');

  useEffect(() => {
    const fetchUploads = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        // prefer token from hook, but fall back to stored auth in localStorage if available
        let usedToken = token;
        if (!usedToken) {
          try {
            const saved = localStorage.getItem('libraria_auth');
            if (saved) {
              const parsed = JSON.parse(saved);
              usedToken = parsed?.token || parsed?.access_token || null;
            }
          } catch (e) {
            /* ignore */
          }
        }
        if (usedToken) headers['Authorization'] = `Bearer ${usedToken}`;

        const res = await fetch('/api/notes/my', { headers });
        if (!res.ok) {
          // if 401, try once using fresh localStorage token (might have been updated elsewhere)
          if (res.status === 401) {
            const saved = localStorage.getItem('libraria_auth');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                const retryToken = parsed?.token || parsed?.access_token || null;
                if (retryToken && retryToken !== usedToken) {
                  headers['Authorization'] = `Bearer ${retryToken}`;
                  const retry = await fetch('/api/notes/my', { headers });
                  if (retry.ok) {
                    const j2 = await retry.json();
                    setUploads(Array.isArray(j2) ? j2 : []);
                    setLoading(false);
                    return;
                  }
                }
              } catch (e) {
                // fall through to error handling
              }
            }
          }
          const txt = await res.text();
          throw new Error(`${res.status} ${txt}`);
        }
        const j = await res.json();
        // Expecting an array of note objects
        setUploads(Array.isArray(j) ? j : []);
      } catch (err: any) {
        console.error('Failed to load uploads', err);
        // Show a friendly message on 401
        if (String(err?.message || '').startsWith('401')) {
          setError('You are not authorized. Please log in.');
        } else {
          setError(err?.message || 'Failed to load uploads');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note? This will remove the file and the record.')) return;
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/notes/${id}/delete`, { method: 'DELETE', headers });
      if (!res.ok && res.status !== 204) {
        const txt = await res.text();
        throw new Error(`${res.status} ${txt}`);
      }
      // remove from list
      setUploads(prev => prev.filter(x => x.id !== id));
    } catch (err: any) {
      console.error('Delete failed', err);
      alert('Failed to delete note: ' + (err?.message || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <ParticleSystem particleCount={120} color="#f97316" speed={0.001} />

      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none z-0">
            <Animated3DHeader title="My Uploaded Notes" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">📝 My Uploaded Notes</h2>
              <p className="text-gray-600 dark:text-amber-200 text-sm">
                Manage your contributions to the knowledge base
              </p>
            </motion.div>
            <Link to="/app/notes/upload">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                Upload Notes
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-lg"
        >
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          )}
          {error && <div className="p-6 text-red-600 dark:text-red-400 font-medium">{error}</div>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-700">
                  <tr>
                    <th className="p-4 text-left font-bold text-orange-600 dark:text-orange-400">Title</th>
                    <th className="p-4 text-left font-bold text-orange-600 dark:text-orange-400">Upload Date</th>
                    <th className="p-4 text-left font-bold text-orange-600 dark:text-orange-400">Status</th>
                    <th className="p-4 text-left font-bold text-orange-600 dark:text-orange-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u, index) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-amber-100">{u.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-amber-200">{u.created_at || u.updated_at || '-'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          String(u.status || '').toLowerCase() === 'approved' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : String(u.status || '').toLowerCase() === 'rejected'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {u.status}
                        </span>
                        {u.status==='rejected' && u.rejection_reason && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">{u.rejection_reason}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {String(u.status || '').toLowerCase() === 'approved' ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { setPreviewUrl(`/api/notes/${u.id}/view`); setPreviewType(u.file_type || 'pdf'); }}
                              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
                            >
                              <EyeIcon className="w-4 h-4" />
                              View
                            </motion.button>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(u.id)}
                              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-medium transition-all"
                            >
                              <TrashIcon className="w-4 h-4" />
                              Delete
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {uploads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                          <h3 className="text-xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">No uploads yet</h3>
                          <p className="text-gray-600 dark:text-amber-100">Share your knowledge by uploading your first note!</p>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
      {previewUrl && (
        <FileViewer url={previewUrl} type={previewType} role="user" onClose={() => { setPreviewUrl(''); setPreviewType(''); }} />
      )}
    </div>
  );
};

export default MyUploadedNotesPage;
