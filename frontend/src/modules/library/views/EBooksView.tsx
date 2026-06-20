import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import { ebookIssueService } from '../../../services/ebookIssueService';
import { bookService, type Book } from '../../../services/bookService';
import FileViewer from '../../../components/FileViewer';
import { BookOpenIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ParticleSystem } from '../../../components/3d/ParticleSystem';
import { Animated3DHeader } from '../../../components/3d/Animated3DHeader';

type IssuedItem = {
  id: string;
  user_id: string;
  book_id: string;
  issued_at: string;
  expiry_date?: string | null;
  status: string;
  book?: Book | null;
};

export const EBooksView: React.FC = () => {
  const auth = useAuth();
  const [items, setItems] = useState<IssuedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const load = async () => {
    const userId = auth.user?.id || JSON.parse(localStorage.getItem('libraria_auth') || 'null')?.user?.id;
    if (!userId) return;
    try {
      setLoading(true);
      const issues: any[] = await ebookIssueService.getUserIssues(String(userId));
      // Only display active issues (hide revoked/expired)
      const activeIssues = issues.filter((it: any) => String(it.status).toLowerCase() === 'active');
      // fetch book details in parallel
      const withBooks = await Promise.all(activeIssues.map(async (it: any) => {
        try {
          const b = await bookService.getBook(String(it.book_id));
          return { ...it, book: b } as IssuedItem;
        } catch (e) {
          return { ...it, book: null } as IssuedItem;
        }
      }));
      setItems(withBooks);
    } catch (e) {
      console.error('Failed to load ebook issues', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [auth.user]);

  const handleRevoke = async (issueId: string) => {
    if (!confirm('Remove access to this e-book?')) return;
    try {
      await ebookIssueService.revokeIssue(issueId);
      await load();
    } catch (e) {
      console.error('Failed to revoke issue', e);
      alert('Failed to remove issued e-book');
    }
  };

  const handleOpen = (book: Book | null) => {
    if (!book || (!book.ebook_url && !(book as any).mega_public_link && !(book as any).mega_path)) {
      alert('No e-book URL available for this item');
      return;
    }

    // Prefer stored public link (ebook_url). If we have a MEGA path or public link,
    // proxy it through the backend so the FileViewer can stream it securely.
    const api = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const sourceUrl = book.ebook_url || (book as any).mega_public_link || (book as any).mega_path;
    const proxyUrl = `${api}/books/proxy-mega?url=${encodeURIComponent(String(sourceUrl))}`;
    setViewerUrl(proxyUrl);
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* 3D Particle Background */}
      <ParticleSystem particleCount={120} color="#f97316" speed={0.001} />

      {/* Header with enhanced styling */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 3D Animated Header Background */}
          <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none z-0">
            <Animated3DHeader title="E-Books Collection" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">📱 E-Books Collection</h2>
              <p className="text-gray-600 dark:text-amber-200 text-sm">
                Access your digital library anytime, anywhere
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        )}

        {!loading && items.length === 0 && (
          <motion.div 
            className="text-center py-16" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <BookOpenIcon className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
            </motion.div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">No E-Books Yet</h3>
            <p className="text-gray-600 dark:text-amber-100 max-w-md mx-auto">
              You haven't been issued any e-books yet. Browse the library and get your first e-book!
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it, index) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -8 }}
              className="cursor-pointer h-full"
            >
              <motion.div
                className="h-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-md hover:shadow-2xl hover:border-orange-200 dark:hover:border-orange-900/50 transition-all"
                whileHover={{ boxShadow: '0 20px 40px rgba(249, 115, 22, 0.15)' }}
              >
                <Card 
                  hover={false}
                  variant="elevated"
                  elevation={0}
                  className="h-full p-0 border-0 shadow-none"
                >
                  <div className="flex flex-col h-full p-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                          <DocumentTextIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-amber-100">
                            {it.book?.title || 'Unknown title'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-amber-200">
                            by {it.book?.author || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-amber-100">
                        <p><strong>Issued:</strong> {new Date(it.issued_at).toLocaleDateString()}</p>
                        {it.expiry_date && (
                          <p><strong>Expires:</strong> {new Date(it.expiry_date).toLocaleDateString()}</p>
                        )}
                        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg">
                          Active
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        {it.book?.ebook_url ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleOpen(it.book || null)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
                          >
                            <BookOpenIcon className="w-4 h-4" />
                            <span>Read Now</span>
                          </motion.button>
                        ) : null}

                        {(auth.user?.id === String(it.user_id) || auth.hasRole('Admin')) ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRevoke(it.id)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all"
                            title="Remove access"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </motion.button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FileViewer uses AdvancedNotesViewer for user role */}
      {viewerOpen && viewerUrl && (
        // Use the basic/simple viewer (admin-style) so PDFs load in a plain iframe
        <FileViewer url={viewerUrl} type="pdf" role="admin" onClose={() => { setViewerOpen(false); setViewerUrl(null); }} />
      )}
    </div>
  );
};