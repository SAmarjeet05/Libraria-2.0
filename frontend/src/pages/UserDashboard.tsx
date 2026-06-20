import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { bookService, Book } from '../services/bookService';
import { notesService, Note } from '../services/notesService';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { ParticleSystem, Animated3DHeader } from '../components/3d';

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch books and notes in parallel
        const [booksData, notesData] = await Promise.all([
          bookService.getBooks(),
          notesService.getNotes()
        ]);
        
        // Filter available books and take top 3
        const availableBooks = booksData
          .filter((book) => book.status === 'available')
          .slice(0, 3);
        setPopularBooks(availableBooks);
        
        // Filter approved notes and take recent 3
        const approvedNotes = notesData
          .filter((note) => note.status?.toLowerCase() === 'approved')
          .slice(0, 3);
        setRecentNotes(approvedNotes);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="py-12 px-6">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 px-6">
        <div className="text-center py-20">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* 3D Particle Background */}
      <ParticleSystem particleCount={100} color="#f97316" speed={0.001} />

      <div className="py-12 px-6 relative z-10">
      <div className="relative mb-12">
        <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none">
          <Animated3DHeader title="Welcome to Libraria AI" />
        </div>
        <h1 className="text-4xl font-black mb-2 text-center bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent relative z-10">Welcome to Libraria AI</h1>
        <p className="text-gray-600 dark:text-amber-100 text-center relative z-10">
          Discover popular resources and recent updates
        </p>
      </div>

      {/* Popular Books Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Popular Books</h2>
          <Link 
            to="/app/library/books"
            className="text-orange-600 hover:text-red-600 dark:text-orange-400 dark:hover:text-red-400 font-semibold transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularBooks.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-lg font-medium mb-2">No books available</p>
              <p className="text-sm">Check back later for new additions</p>
            </div>
          ) : (
            popularBooks.map((book) => (
            <div key={book.id} onClick={() => navigate(`/app/library/books?bookId=${book.id}`)} className="cursor-pointer">
              <Card hover glow className="h-full overflow-hidden">
                <div className="relative aspect-[3/4] mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-icon');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`fallback-icon absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 ${book.cover_url ? 'hidden' : ''}`}>
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2">{book.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by {book.author}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary-600 dark:text-primary-400">
                    {book.category?.name || 'Uncategorized'}
                  </span>
                  <span className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                    Available
                  </span>
                </div>
              </Card>
            </div>
          )))}
        </div>
      </div>

      {/* Recent Notes Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Recent Notes</h2>
          <Link 
            to="/app/notes/all"
            className="text-orange-600 hover:text-red-600 dark:text-orange-400 dark:hover:text-red-400 font-semibold transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentNotes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium mb-2">No notes available</p>
              <p className="text-sm">Check back later for new uploads</p>
            </div>
          ) : (
            recentNotes.map((note) => (
            <div key={note.id} onClick={() => navigate(`/app/notes/all?noteId=${note.id}`)} className="cursor-pointer">
              <Card hover glow className="h-full overflow-hidden">
                <div className="relative aspect-video mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{note.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {note.description || note.content || 'No description available'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary-600 dark:text-primary-400">
                    {note.subject || note.category || 'General'}
                  </span>
                  <div className="flex gap-1">
                    {(Array.isArray(note.tags) ? note.tags : []).slice(0, 2).map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="text-xs px-2 py-1 bg-primary-100/50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )))}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/app/library/books">
            <Card hover glow className="text-center h-full overflow-hidden card-interactive card-overlay card-stagger">
              <div className="relative aspect-square w-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 icon-scale">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold">Browse Library</h3>
            </Card>
          </Link>
          <Link to="/app/notes/upload">
            <Card hover glow className="text-center h-full overflow-hidden card-interactive card-overlay card-stagger">
              <div className="relative aspect-square w-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 icon-scale">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold">Upload Notes</h3>
            </Card>
          </Link>
          {/* Healthcare quick-action removed */}
          <Link to="/app/settings">
            <Card hover glow className="text-center h-full overflow-hidden card-interactive card-overlay card-stagger">
              <div className="relative aspect-square w-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 icon-scale">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold">Settings</h3>
            </Card>
          </Link>
        </div>
      </div>

      {/* Book Details Modal */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedBook(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedBook.title}</h2>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    {selectedBook.cover_url ? (
                      <img
                        src={selectedBook.cover_url}
                        alt={selectedBook.title}
                        className="w-full rounded-lg shadow-lg"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Author</h3>
                      <p className="text-gray-900 dark:text-white">{selectedBook.author}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">ISBN</h3>
                      <p className="text-gray-900 dark:text-white">{selectedBook.isbn}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Category</h3>
                      <p className="text-gray-900 dark:text-white">{selectedBook.category?.name || 'Uncategorized'}</p>
                    </div>
                    {selectedBook.publisher && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Publisher</h3>
                        <p className="text-gray-900 dark:text-white">{selectedBook.publisher}</p>
                      </div>
                    )}
                    {selectedBook.publication_year && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Year</h3>
                        <p className="text-gray-900 dark:text-white">{selectedBook.publication_year}</p>
                      </div>
                    )}
                    {selectedBook.location && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Location</h3>
                        <p className="text-gray-900 dark:text-white">{selectedBook.location}</p>
                      </div>
                    )}
                    {selectedBook.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Description</h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{selectedBook.description}</p>
                      </div>
                    )}
                    <div className="pt-4">
                      <Link to="/app/library/books">
                        <Button className="w-full">View in Library</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
};