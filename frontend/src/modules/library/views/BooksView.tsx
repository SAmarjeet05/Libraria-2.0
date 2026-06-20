import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, BookOpenIcon,
  UserGroupIcon, XCircleIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { RoleGuard } from '../../../components/auth/RoleGuard';
import { ParticleSystem, Animated3DHeader, Interactive3DBackground, Book3DCard } from '../../../components/3d';
import { bookService, type Book, type BookCreate } from '../../../services/bookService';
import { reviewService, type Review } from '../../../services/reviewService';
import { categoryService, type Category } from '../../../services/categoryService';
import { wishlistService } from '../../../services/wishlistService';
import { ebookIssueService } from '../../../services/ebookIssueService';
import { bookRequestService } from '../../../services/bookRequestService';
import { useAuth } from '../../../hooks/useAuth';

interface BookDetails extends Book {
  stats?: {
    totalViews: number;
    totalIssues: number;
    avgRating: number;
    popularity: number;
  };
  reviews?: Array<{
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  similarBooks?: Book[];
}

export const BooksView: React.FC = () => {
  console.log('BooksView rendering');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [books, setBooks] = useState<BookDetails[]>([]);
  const [_loading, _setLoading] = useState(true);
  const [_error, _setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  console.log('Current categories state:', categories);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedBooks, fetchedCategories, fetchedIssues, fetchedViews, fetchedPopularity] = await Promise.all([
          bookService.getBooks(),
          categoryService.getCategories(),
          (async () => {
            try {
              return await bookService.getBookIssues();
            } catch (e) {
              console.warn('Failed to fetch book issues, falling back to empty list', e);
              return [] as Array<{book_id: string; title: string; issues: number}>;
            }
          })(),
          (async () => {
            try {
              return await bookService.getAllBooksViews();
            } catch (e) {
              console.warn('Failed to fetch book views, falling back to empty list', e);
              return [] as Array<{book_id: string; total_views: number}>;
            }
          })(),
          (async () => {
            try {
              return await bookService.getAllBooksPopularity();
            } catch (e) {
              console.warn('Failed to fetch popularity scores, falling back to empty list', e);
              return [] as Array<{book_id: string; popularity: number}>;
            }
          })()
        ]);

        setCategories(fetchedCategories);

        const issuesMap = new Map<string, number>();
        (fetchedIssues || []).forEach((item: any) => {
          if (item && item.book_id) issuesMap.set(String(item.book_id), Number(item.issues || 0));
        });

        const viewsMap = new Map<string, number>();
        (fetchedViews || []).forEach((item: any) => {
          if (item && item.book_id) viewsMap.set(String(item.book_id), Number(item.total_views || 0));
        });

        const popularityMap = new Map<string, number>();
        (fetchedPopularity || []).forEach((item: any) => {
          if (item && item.book_id) popularityMap.set(String(item.book_id), Number(item.popularity || 0));
        });

        setBooks(fetchedBooks.map(book => ({
          ...book,
          stats: {
            totalViews: viewsMap.get(String(book.id)) ?? 0,
            totalIssues: issuesMap.get(String(book.id)) ?? 0,
            avgRating: (book as any).avgRating ?? (book as any).avg_rating ?? 0,
            popularity: popularityMap.get(String(book.id)) ?? 0
          },
          reviews: []
        })));
      } catch (err) {
        _setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        _setLoading(false);
      }
    };

    fetchData();
    
    // Set up auto-refresh of popularity every 5 minutes
    const popularityRefreshInterval = setInterval(() => {
      (async () => {
        try {
          const fetchedPopularity = await bookService.getAllBooksPopularity();
          setBooks(prevBooks => 
            prevBooks.map(book => {
              const popularityData = fetchedPopularity.find((p: any) => String(p.book_id) === String(book.id));
              return {
                ...book,
                stats: {
                  totalViews: book.stats?.totalViews ?? 0,
                  totalIssues: book.stats?.totalIssues ?? 0,
                  avgRating: book.stats?.avgRating ?? 0,
                  popularity: popularityData?.popularity ?? book.stats?.popularity ?? 0
                }
              };
            })
          );
          console.log('Popularity scores auto-updated');
        } catch (err) {
          console.warn('Failed to auto-refresh popularity scores:', err);
        }
      })();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(popularityRefreshInterval);
  }, []);
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<BookDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'popularity' | 'rating'>('title');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Track currently viewing book details
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'details' | 'reviews' | 'stats'>('details');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'positive' | 'critical'>('all');
  const [reviewSort, setReviewSort] = useState<'new' | 'top'>('new');
  const [reviewForm, setReviewForm] = useState<{ rating: number; review_text: string }>({ rating: 0, review_text: '' });
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [ebookIssuesData, setEbookIssuesData] = useState<Array<{ date: string; count: number }>>([]);
  const [formValues, setFormValues] = useState<Partial<BookCreate>>({
    title: '',
    author: '',
    isbn: '',
    category_id: undefined,
    publisher: '',
    description: '',
    total_copies: 1,
    has_ebook: false,
    ebook_url: '',
    status: 'available',
    cover_url: '',
    publication_year: undefined
  });
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [_uploadingEbook, _setUploadingEbook] = useState(false);

  // Track cover images that failed to load so we can show the inline SVG fallback
  const [failedCovers, setFailedCovers] = useState<Record<string, boolean>>({});
  const [overrideSrc, setOverrideSrc] = useState<Record<string, string>>({});

  const hasValidCover = (url: any) => {
    if (!url || typeof url !== 'string') return false;
    const s = url.trim();
    if (!s) return false;
    if (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return false;
    return true;
  };

  // When books list updates, clear any failed flags for books that now have a cover_url
  useEffect(() => {
  const idsWithCover = books.filter(b => hasValidCover((b as any).cover_url)).map(b => String(b.id));
    if (idsWithCover.length === 0) return;
    setFailedCovers(prev => {
      const next = { ...prev };
      let changed = false;
      idsWithCover.forEach(id => {
        if (next[id]) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // Reset overrideSrc so we let the primary cover_url be tried again first
    setOverrideSrc(prev => {
      const next = { ...prev };
      let changed = false;
      idsWithCover.forEach(id => {
        if (next[id]) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [books]);

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formValues.title || !formValues.author || !formValues.isbn) {
        alert('Please fill in all required fields (Title, Author, ISBN)');
        return;
      }

      // If an ebook file is selected, upload it first (admin-only flow)
      let uploadedEbookUrl: string | undefined = undefined;
      if (ebookFile) {
        try {
          _setUploadingEbook(true);
          const res = await bookService.uploadEbook(ebookFile);
          // capture returned public link so we can include it in the payload
          uploadedEbookUrl = res.mega_public_link;
          // optimistically mark has_ebook true
          handleFormChange('has_ebook', true);
        } catch (err) {
          console.error('Ebook upload failed', err);
          alert('E-book upload failed: ' + (err as any)?.response?.data?.detail || String(err));
          _setUploadingEbook(false);
          return;
        } finally {
          _setUploadingEbook(false);
        }
      }

      // Ensure numbers are proper numbers
      const bookData = {
        ...formValues,
        // prefer freshly uploaded URL if present
        ebook_url: uploadedEbookUrl || formValues.ebook_url,
        status: formValues.status || 'available',
        total_copies: Number(formValues.total_copies) || 1,
        publication_year: formValues.publication_year ? Number(formValues.publication_year) : undefined,
        category_id: formValues.category_id ? Number(formValues.category_id) : undefined
      };

      console.log('Submitting book data:', bookData);

      if (selectedBook) {
        // Update existing book
        const updatedBook = await bookService.updateBook(selectedBook.id, bookData);
        setBooks(books.map(book => 
          book.id === updatedBook.id ? {
            ...updatedBook,
            stats: book.stats,
            reviews: book.reviews,
            similarBooks: book.similarBooks
          } : book
        ));
      } else {
        // Create new book
        const newBook = await bookService.createBook(bookData as BookCreate);
        setBooks([...books, {
          ...newBook,
          stats: {
            totalViews: 0,
            totalIssues: 0,
            avgRating: 0,
            popularity: 0
          },
          reviews: []
        }]);
      }
      setShowModal(false);
      setSelectedBook(null);
      // clear any selected ebook file after submit
      setEbookFile(null);
    } catch (error: any) {
      console.error('Error submitting book:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'An error occurred while saving the book';
      alert(errorMessage);
    }
  };

  useEffect(() => {
    if (selectedBook) {
      setFormValues({
        title: selectedBook.title,
        author: selectedBook.author,
        isbn: selectedBook.isbn,
        category_id: selectedBook.category?.id,
        publisher: selectedBook.publisher || '',
        description: selectedBook.description || '',
        total_copies: selectedBook.total_copies,
        has_ebook: selectedBook.has_ebook,
        ebook_url: selectedBook.ebook_url || '',
        status: selectedBook.status,
        cover_url: (selectedBook as any).cover_url || '',
        publication_year: (selectedBook as any).publication_year
        ,location: (selectedBook as any).location || 'Main Library - Shelf A1'
      });
    } else {
      setFormValues({
        title: '',
        author: '',
        isbn: '',
        category_id: undefined,
        description: '',
        total_copies: 1,
        available_copies: 1,
        has_ebook: false,
        ebook_url: '',
        location: 'Main Library - Shelf A1',
        status: 'available'
      });
    }
  }, [selectedBook]);

  const handleFormChange = (field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredBooks = books.filter(book => {
    const term = activeSearch || searchTerm;
    const q = term.trim().toLowerCase();
    const matchesSearch = q === '' || (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      (book.category?.name.toLowerCase() || '').includes(q)
    );

  const bookCategoryId = book.category?.id ?? (book as any).category_id;
  const matchesCategory = filterCategory === 'all' || Number(bookCategoryId) === Number(filterCategory);

    return matchesSearch && matchesCategory;
  });

  // Apply sorting to filtered list
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'author':
        return a.author.localeCompare(b.author);
      case 'popularity':
        return (b.stats?.popularity || 0) - (a.stats?.popularity || 0);
      case 'rating':
        return (b.stats?.avgRating || 0) - (a.stats?.avgRating || 0);
      default:
        return 0;
    }
  });

  const handleViewBook = (book: BookDetails) => {
    setSelectedBook(book);
    setShowBookDetails(true);
    setReviewFilter('all');
    setReviewSort('new');
    
    // Record book view
    (async () => {
      try {
        await bookService.recordBookView(String(book.id));
        // Update the totalViews in the book's stats
        setBooks(prevBooks => prevBooks.map(b => 
          b.id === book.id 
            ? { 
                ...b, 
                stats: b.stats 
                  ? { ...b.stats, totalViews: (b.stats.totalViews || 0) + 1 } 
                  : { totalViews: 1, totalIssues: 0, avgRating: 0, popularity: 0 }
              }
            : b
        ) as BookDetails[]);
      } catch (err) {
        console.warn('Failed to record book view', err);
      }
    })();

    // Fetch reviews for this book
    (async () => {
      try {
        const res = await reviewService.getReviews(String(book.id), { filter: 'all', sort: 'new' });
        setReviews(res || []);
        const uid = JSON.parse(localStorage.getItem('libraria_auth') || 'null')?.user?.id;
        const ur = (res || []).find(r => String(r.user_id) === String(uid)) || null;
        setUserReview(ur);
        if (ur) {
          setReviewForm({ rating: ur.rating, review_text: ur.review_text || '' });
          setEditingReviewId(null);
        } else {
          setReviewForm({ rating: 0, review_text: '' });
          setEditingReviewId(null);
        }
      } catch (err) {
        console.error('Failed to load reviews', err);
      }
    })();
  };

  // Function to fetch reviews with current filter/sort
  const fetchReviewsWithFilters = async () => {
    if (!selectedBook) return;
    try {
      const res = await reviewService.getReviews(String(selectedBook.id), { 
        filter: reviewFilter === 'all' ? undefined : reviewFilter, 
        sort: reviewSort === 'new' ? undefined : reviewSort 
      });
      setReviews(res || []);
      const uid = JSON.parse(localStorage.getItem('libraria_auth') || 'null')?.user?.id;
      const ur = (res || []).find(r => String(r.user_id) === String(uid)) || null;
      setUserReview(ur);
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
  };

  // Refetch reviews when filter or sort changes
  useEffect(() => {
    if (selectedBook && showBookDetails) {
      fetchReviewsWithFilters();
    }
  }, [reviewFilter, reviewSort]);

  // Auto-open book details modal if bookId is in URL
  useEffect(() => {
    const bookId = searchParams.get('bookId');
    console.log('Checking for bookId:', bookId, 'books length:', books.length);
    if (bookId && books.length > 0) {
      // Compare both as strings to handle type mismatches
      const book = books.find(b => String(b.id) === String(bookId));
      console.log('Found book:', book);
      if (book) {
        handleViewBook(book);
        // Remove the bookId parameter from URL after opening modal
        setSearchParams({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, searchParams, setSearchParams]);

  // Fetch ebook issues data when stats tab is opened
  useEffect(() => {
    if (selectedBook && selectedTab === 'stats') {
      const fetchEbookData = async () => {
        try {
          const res = await fetch(`/api/reports/ebook_issues_by_book/${selectedBook.id}`);
          if (res.ok) {
            const data = await res.json();
            setEbookIssuesData(data || []);
          }
        } catch (err) {
          console.error('Failed to fetch ebook issues data', err);
        }
      };
      fetchEbookData();
    }
  }, [selectedBook, selectedTab]);

  const handleEditBook = (book: BookDetails) => {
    setSelectedBook(book);
    setShowModal(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await bookService.deleteBook(bookId);
      setBooks(books.filter(book => book.id !== bookId));
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  const handleRequestBook = async (bookId: string) => {
    try {
      // Prevent requesting if there are no available copies
      const book = books.find(b => b.id === bookId);
      const available = Number((book as any)?.available_copies ?? (book as any)?.total_copies ?? 0);
      if (available <= 0) {
        alert('No copies available to request');
        return;
      }

      // Check if user already has this book issued (active borrow record)
      try {
        const borrowRecords = await bookService.getUserBorrowRecords();
        const hasActiveIssue = borrowRecords.some(record => 
          String(record.book_id) === String(bookId) && record.status === 'active'
        );
        
        if (hasActiveIssue) {
          alert('You already have this book issued. Please return it before requesting another copy.');
          return;
        }
      } catch (err) {
        console.warn('Failed to check borrow records, proceeding with request', err);
      }

      // Create a book request record (admin will review it)
      await bookRequestService.createRequest({ book_id: String(bookId) });
      alert('Your request has been submitted for review by an admin.');
    } catch (err) {
      console.error('Error creating book request:', err);
      const detail = (err as any)?.message || (err as any)?.response?.data?.detail || String(err);
      if (/already has this book issued|already issued/i.test(String(detail))) {
        alert('User already has this book issued');
      } else {
        alert(`Failed to submit request: ${detail}`);
      }
    }
  };

  const handleAddToWishlist = async (bookId: string) => {
    try {
      // If not logged in, prompt to login
      const userId = auth.user?.id || JSON.parse(localStorage.getItem('libraria_auth') || 'null')?.user?.id;
      if (!userId) {
        alert('You must be logged in to add items to your wishlist');
        return;
      }

      // Fetch current wishlist and avoid duplicates
      const current = await wishlistService.getWishlist();
      const exists = current.some(item => String(item.book_id) === String(bookId));
      if (exists) {
        alert('This book is already in your wishlist');
        return;
      }

      await wishlistService.addToWishlist({ book_id: bookId });
      alert('Book added to your wishlist');
    } catch (err: any) {
      console.error('Failed to add to wishlist:', err);
      const msg = err?.response?.data?.detail || err?.message || 'Failed to add to wishlist';
      alert(msg);
    }
  };

  const auth = useAuth();

  // Determine if the current user is an admin using the hook helper when available.
  // The `useAuth` hook stores `user.role` as either 'Admin' or 'User'. Prefer the
  // `hasRole` helper if present for consistency.
  const isAdminUser = Boolean(
    (auth as any)?.hasRole?.('Admin') || ((auth as any)?.user as any)?.role === 'Admin'
  );

  const handleGetEbook = async (book: BookDetails) => {
    try {
      if (!book.has_ebook && !(book as any).ebook_url) {
        alert('E-book not available for this book');
        return;
      }

      const userId = auth.user?.id || JSON.parse(localStorage.getItem('libraria_auth') || 'null')?.user?.id;
      if (!userId) {
        alert('You must be logged in to get an e-book');
        return;
      }

      // Issue the ebook for the user
      await ebookIssueService.createIssue({ user_id: String(userId), book_id: String(book.id) });
      alert('E-book successfully issued to your account. Check E-Books.');
    } catch (e) {
      // Improved error diagnostics for network/server issues
      console.error('Failed to issue ebook - full error:', e);
      const errMsg = (e as any)?.message || String(e);
      // If the error indicates the ebook is already issued, show a concise message
      if (/already issued/i.test(errMsg) || /user already has this ebook/i.test(errMsg)) {
        alert('User already has this ebook');
      } else {
        const extra = (e as any)?.status ? ` (status ${ (e as any).status })` : '';
        alert(`Failed to issue e-book: ${errMsg}${extra}`);
      }
    }
  };

  const handleRateBook = (bookId: string, rating: number) => {
    setBooks(books.map(book => 
      book.id === bookId 
        ? { 
            ...book, 
            stats: book.stats ? {
              ...book.stats,
              avgRating: ((book.stats.avgRating * (book.reviews?.length || 0) + rating) / 
                         ((book.reviews?.length || 0) + 1))
            } : undefined
          }
        : book
    ));
  };

  const StatusBadge: React.FC<{ status: Book['status'] }> = ({ status }) => {
    const getStatusConfig = (s: Book['status']) => {
      switch (s) {
        case 'available':
          return {
            bgGradient: 'from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600',
            shadowColor: 'shadow-emerald-500/50',
            icon: '✓',
            label: 'Available',
            textColor: 'text-white',
            pulse: true
          };
        case 'reserved':
          return {
            bgGradient: 'from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600',
            shadowColor: 'shadow-amber-500/50',
            icon: '⏳',
            label: 'Reserved',
            textColor: 'text-white',
            pulse: false
          };
        case 'removed':
          return {
            bgGradient: 'from-red-400 to-rose-500 dark:from-red-500 dark:to-rose-600',
            shadowColor: 'shadow-red-500/50',
            icon: '✕',
            label: 'Removed',
            textColor: 'text-white',
            pulse: false
          };
        default:
          return {
            bgGradient: 'from-gray-400 to-slate-500 dark:from-gray-500 dark:to-slate-600',
            shadowColor: 'shadow-gray-500/50',
            icon: '○',
            label: status,
            textColor: 'text-white',
            pulse: false
          };
      }
    };

    const config = getStatusConfig(status);

    return (
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${config.textColor} bg-gradient-to-r ${config.bgGradient} shadow-lg ${config.shadowColor} hover:shadow-2xl transition-all duration-300 cursor-default`}
      >
        <motion.span 
          animate={config.pulse ? { scale: [1, 1.2, 1] } : {}}
          transition={config.pulse ? { duration: 2, repeat: Infinity } : {}}
          className="text-lg"
        >
          {config.icon}
        </motion.span>
        <span className="capitalize">{config.label}</span>
        {config.pulse && (
          <motion.span 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 opacity-20"
          />
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* 3D Particle Background */}
      <ParticleSystem particleCount={120} color="#ff6b35" speed={0.001} />

      {/* Header with enhanced styling */}
      <div className={`border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 shadow-md ${showModal ? 'z-0' : 'z-20'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 3D Animated Header Background */}
          <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none z-0">
            <Animated3DHeader title="Books Library" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">📚 Books Library</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Discover and manage your collection
              </p>
            </motion.div>
            
            <RoleGuard requiredRole="ADMIN" showFallback={false}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => setShowModal(true)} 
                  variant="filled"
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Add Book</span>
                </Button>
              </motion.div>
            </RoleGuard>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Search and Filters */}
        <motion.div className="mb-8 space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <motion.div whileHover={{ scale: 1.02 }} className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400" />
                <Input
                  type="text"
                  placeholder="Search books, authors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveSearch(searchTerm);
                    }
                  }}
                />
              </motion.div>
            </div>
            <motion.div className="flex items-center space-x-2" whileHover={{ scale: 1.02 }}>
              <Button size="sm" variant="filled" onClick={() => setActiveSearch(searchTerm)} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">Search</Button>
              <Button size="sm" variant="outlined" onClick={() => { setSearchTerm(''); setActiveSearch(''); }}>Clear</Button>
            </motion.div>
          </div>

          {/* View Controls with enhanced styling */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('grid')}
                className={`p-2 rounded transition-all ${
                  view === 'grid' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Grid view"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('list')}
                className={`p-2 rounded transition-all ${
                  view === 'list' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="List view"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>
            </div>

            <motion.select
              whileHover={{ scale: 1.02 }}
              className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50 transition-all cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="title">Sort by Title</option>
              <option value="author">Sort by Author</option>
              <option value="popularity">Sort by Popularity</option>
              <option value="rating">Sort by Rating</option>
            </motion.select>

            <motion.select
              whileHover={{ scale: 1.02 }}
              className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50 transition-all cursor-pointer"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </motion.select>
          </div>
        </motion.div>

      {/* Books Grid/List View */}
      <div className={view === 'grid' ? 
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
        "space-y-4"
      }>
        {sortedBooks.map((book, index) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -8 }}
            onClick={() => handleViewBook(book)}
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
                <div className="flex flex-col h-full">
                <div className="flex-1">
                  {/* Use 3D Card in grid view, regular image in list view */}
                  {view === 'grid' && hasValidCover(book.cover_url) ? (
                    <Book3DCard
                      coverUrl={overrideSrc[String(book.id)] || book.cover_url || ''}
                      title={book.title}
                      author={book.author}
                      onClick={() => handleViewBook(book)}
                    />
                  ) : hasValidCover(book.cover_url) && !failedCovers[String(book.id)] ? (
                    <div className="mb-3">
                      <img
                        src={overrideSrc[String(book.id)] || book.cover_url || ''}
                        alt={`${book.title} cover`}
                        className="w-full h-80 md:h-96 object-cover rounded-md"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const cover = book.cover_url || '';
                          console.error('[books cover] failed', book.id, cover, e);
                          if (!overrideSrc[String(book.id)] && cover) {
                            const api = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                            const prox = `${api}/proxy/image?url=${encodeURIComponent(cover)}`;
                            setOverrideSrc(prev => ({ ...prev, [String(book.id)]: prox }));
                            console.debug('[books cover] retrying via proxy', book.id, prox);
                            return;
                          }
                          setFailedCovers(prev => ({ ...prev, [String(book.id)]: true }));
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mb-3 w-full h-80 md:h-96 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-500">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        by {book.author}
                      </p>
                    </div>
                    <StatusBadge status={book.status} />
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>ISBN:</strong> {book.isbn}</p>
                    <p><strong>Category:</strong> {book.category?.name}</p>
                    <p><strong>Location:</strong> {book.location || 'Main Library - Shelf A1'}</p>
                    {book.stats && (
                      <div className="flex items-center gap-1">
                        <strong>Rating:</strong>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIconSolid
                              key={star}
                              className={`w-4 h-4 ${
                                star <= book.stats!.avgRating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                          <span className="ml-1">({book.stats.avgRating})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <UserGroupIcon className="w-4 h-4" />
                    <span><strong>{book.stats?.totalIssues || 0}</strong> issues</span>
                    <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                      {book.stats?.totalViews || 0} views
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    {/* Wishlist and Get eBook buttons are only for non-admin users */}
                    {!isAdminUser && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToWishlist(book.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
                          title="Add to wishlist"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4v16l8-6 8 6V4z" /></svg>
                          <span>Wishlist</span>
                        </motion.button>

                        {(book.has_ebook || (book as any).ebook_url) ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); handleGetEbook(book); }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
                            title="Get e-book"
                          >
                            <DocumentTextIcon className="w-4 h-4" />
                            <span>eBook</span>
                          </motion.button>
                        ) : null}
                      </>
                    )}

                    <RoleGuard requiredRole="ADMIN" showFallback={false}>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBook(book);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-all"
                          title="Edit book"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBook(book.id);
                          }}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all"
                          title="Delete book"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </RoleGuard>
                  </div>
                </div>
              </div>
            </Card>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <motion.div className="text-center py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <BookOpenIcon className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
          </motion.div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">No books found</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {searchTerm ? 'Try adjusting your search terms or browsing by category' : 'Start by adding books to your library collection'}
          </p>
        </motion.div>
      )}

      {/* Book Details Modal */}
      <AnimatePresence>
        {showBookDetails && selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center ml-64 p-4"
            onAnimationComplete={(definition: any) => {
              if (showBookDetails && definition.opacity === 1) {
                document.body.style.overflow = 'hidden';
              } else if (definition.opacity === 0) {
                document.body.style.overflow = 'auto';
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl relative"
            >
              {/* 3D Background */}
              <Interactive3DBackground width={800} height={600} enabled={true} />

              <Card className="overflow-hidden rounded-3xl relative z-10">
                <div className="flex justify-between items-center mb-6 p-6 pb-0">
                  <h2 className="palette-gradient-text text-2xl font-bold">{selectedBook.title}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBookDetails(false);
                      setSelectedBook(null);
                    }}
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-6 pt-0 max-h-[80vh] overflow-y-auto pr-4">
                  {/* Tabs */}
                  <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                    {(['details', 'reviews', 'stats'] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`pb-3 px-2 font-medium text-sm transition-colors ${
                          selectedTab === tab
                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        onClick={() => setSelectedTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-6">
                    {selectedTab === 'details' && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4 modal-details">
                          {hasValidCover((selectedBook as any).cover_url) && !failedCovers[String((selectedBook as any).id)] ? (
                            <div className="mb-4">
                              <img
                                src={overrideSrc[String((selectedBook as any).id)] || (selectedBook as any).cover_url || ''}
                                alt={selectedBook.title}
                                className="w-full max-h-96 object-contain rounded-md"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  const id = String((selectedBook as any).id);
                                  const url = (selectedBook as any).cover_url || '';
                                  console.error('[books modal cover] failed', id, url, e);
                                  if (!overrideSrc[id] && url) {
                                    const api = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                                    const prox = `${api}/proxy/image?url=${encodeURIComponent(url)}`;
                                    setOverrideSrc(prev => ({ ...prev, [id]: prox }));
                                    console.debug('[books modal cover] retrying via proxy', id, prox);
                                    return;
                                  }
                                  setFailedCovers(prev => ({ ...prev, [String((selectedBook as any).id)]: true }));
                                }}
                              />
                            </div>
                          ) : (
                            <div className="mb-4 w-full max-h-96 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-500">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {selectedBook.description}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-1">Author</h4>
                              <p className="text-gray-600 dark:text-gray-400">{selectedBook.author}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Publisher</h4>
                              <p className="text-gray-600 dark:text-gray-400">{selectedBook.publisher}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Published Year</h4>
                              <p className="text-gray-600 dark:text-gray-400">{selectedBook.publication_year}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Total Copies</h4>
                              <p className="text-gray-600 dark:text-gray-400">{selectedBook.total_copies}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Available Copies</h4>
                              <p className="text-gray-600 dark:text-gray-400">{selectedBook.available_copies}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Added Date</h4>
                              <p className="text-gray-600 dark:text-gray-400">{selectedBook.added_at ? new Date(selectedBook.added_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Location</h4>
                              <p className="text-gray-600 dark:text-gray-400">{(selectedBook as any).location || 'Main Library - Shelf A1'}</p>
                            </div>

                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Availability</h3>
                            <div className="space-y-3">
                              <div className="flex justify-center">
                                <StatusBadge status={selectedBook.status} />
                              </div>
                              {selectedBook.status === 'available' ? (
                                <>
                                  {
                                    // Determine available copies and disable request when none
                                  }
                                  {(() => {
                                    const availableCount = Number((selectedBook as any)?.available_copies ?? (selectedBook as any)?.total_copies ?? 0);
                                    const disabled = availableCount <= 0;
                                    return (
                                      <motion.button
                                        whileHover={!disabled ? { scale: 1.02 } : {}}
                                        whileTap={!disabled ? { scale: 0.98 } : {}}
                                        onClick={() => { if (!disabled) handleRequestBook(selectedBook.id); }}
                                        disabled={disabled}
                                        title={disabled ? 'No copies available to request' : 'Request this book'}
                                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                                          disabled
                                            ? 'opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                                        }`}
                                      >
                                        Request Book
                                      </motion.button>
                                    );
                                  })()}

                                  {!isAdminUser && selectedBook.has_ebook ? (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={(e) => { e.stopPropagation(); handleGetEbook(selectedBook); }}
                                      className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 dark:from-cyan-600 dark:to-cyan-700 dark:hover:from-cyan-700 dark:hover:to-cyan-800 text-white shadow-lg hover:shadow-xl"
                                    >
                                      Get eBook
                                    </motion.button>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleAddToWishlist(selectedBook.id)}
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 dark:from-pink-600 dark:to-rose-600 dark:hover:from-pink-700 dark:hover:to-rose-700 text-white shadow-lg hover:shadow-xl"
                                  >
                                    Add to Wishlist
                                  </motion.button>

                                  {!isAdminUser && selectedBook.has_ebook ? (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={(e) => { e.stopPropagation(); handleGetEbook(selectedBook); }}
                                      className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 dark:from-cyan-600 dark:to-cyan-700 dark:hover:from-cyan-700 dark:hover:to-cyan-800 text-white shadow-lg hover:shadow-xl"
                                    >
                                      Get eBook
                                    </motion.button>
                                  ) : selectedBook.has_ebook ? null : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No e-book available</p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="p-6 bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-800/50 dark:to-emerald-900/20 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Quick Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                                <p className="font-semibold">{selectedBook.stats?.totalViews || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Times Issued</p>
                                <p className="font-semibold">{selectedBook.stats?.totalIssues || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                                <div className="flex items-center">
                                  <span className="font-semibold mr-2">{selectedBook.stats?.avgRating || 0}</span>
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <StarIconSolid
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= (selectedBook.stats?.avgRating || 0)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                        onClick={() => handleRateBook(selectedBook.id, star)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Popularity</p>
                                <p className="font-semibold">
                                  {Math.round((selectedBook.stats?.popularity || 0) * 100)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTab === 'reviews' && (
                      <div className="space-y-6">
                        {/* Add/Edit Review Section */}
                        <div>
                          {userReview && editingReviewId === null ? (
                            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30">
                              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Your Review</h3>
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  {[1,2,3,4,5].map(s => (
                                    <StarIconSolid key={s} className={`w-5 h-5 ${s <= (userReview.rating||0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                  ))}
                                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({userReview.rating} stars)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-green-600 dark:text-green-400">{userReview.upvotes || 0}</span>
                                    <span className="text-gray-400">↑</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-red-600 dark:text-red-400">{userReview.downvotes || 0}</span>
                                    <span className="text-gray-400">↓</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-4">{userReview.review_text}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outlined" onClick={() => { setEditingReviewId(userReview.id); setReviewForm({ rating: userReview.rating, review_text: userReview.review_text || '' }); }}>Edit</Button>
                                <Button size="sm" variant="outlined" className="text-red-600 hover:text-red-700" onClick={async () => {
                                  if (!confirm('Delete your review?')) return;
                                  try {
                                    await reviewService.deleteReview(String(userReview.id));
                                    await fetchReviewsWithFilters();
                                    setEditingReviewId(null);
                                    setUserReview(null);
                                    setReviewForm({ rating: 0, review_text: '' });
                                  } catch (err) {
                                    console.error('Failed to delete review', err);
                                  }
                                }}>Delete</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{editingReviewId === userReview?.id ? 'Edit Your Review' : 'Share Your Review'}</h3>
                              
                              {/* Rating - Horizontal Stars */}
                              <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Rating</label>
                                <div className="flex gap-2">
                                  {[1,2,3,4,5].map(s => (
                                    <button key={s} onClick={() => setReviewForm(prev => ({ ...prev, rating: s }))} className={`transition-all ${
                                      reviewForm.rating > 0 && s <= reviewForm.rating ? 'text-yellow-400 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                                    }`}>
                                      <StarIconSolid className="w-8 h-8" />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Textarea */}
                              <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Your Review</label>
                                <textarea className="w-full rounded-md p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Write your thoughts about this book..." rows={4} value={reviewForm.review_text} onChange={(e) => setReviewForm(prev => ({ ...prev, review_text: e.target.value }))} />
                              </div>

                              {/* Centered Buttons */}
                              <div className="flex items-center justify-center gap-3">
                                <Button size="sm" variant="text" onClick={() => {
                                  setEditingReviewId(null);
                                  if (userReview) {
                                    setReviewForm({ rating: userReview.rating, review_text: userReview.review_text || '' });
                                  } else {
                                    setReviewForm({ rating: 0, review_text: '' });
                                  }
                                }}>Cancel</Button>
                                <Button size="sm" variant="filled" onClick={async () => {
                                  try {
                                    if (editingReviewId === userReview?.id) {
                                      await reviewService.updateReview(String(userReview.id), { rating: reviewForm.rating, review_text: reviewForm.review_text });
                                    } else {
                                      await reviewService.createReview({ book_id: String(selectedBook.id), rating: reviewForm.rating, review_text: reviewForm.review_text });
                                    }
                                    await fetchReviewsWithFilters();
                                    setEditingReviewId(null);
                                    setReviewForm({ rating: 0, review_text: '' });
                                  } catch (err) {
                                    console.error('Failed to save review', err);
                                    alert((err as any)?.response?.data?.detail || String(err));
                                  }
                                }}>{editingReviewId === userReview?.id ? 'Update Review' : 'Submit Review'}</Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Separator Line */}
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

                        {/* Filters and sort */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setReviewFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              reviewFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
                            }`}>All Reviews</button>
                            <button onClick={() => setReviewFilter('positive')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              reviewFilter === 'positive' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
                            }`}>Positive (≥4)</button>
                            <button onClick={() => setReviewFilter('critical')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              reviewFilter === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
                            }`}>Critical (≤2)</button>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Sort:</label>
                            <select value={reviewSort} onChange={(e) => setReviewSort(e.target.value as any)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2">
                              <option value="new">Newest</option>
                              <option value="top">Top Rated</option>
                            </select>
                          </div>
                        </div>

                        {/* Reviews list */}
                        <div className="space-y-3">
                          {reviews && reviews.length > 0 ? (
                            reviews
                              .filter(r => {
                                // Filter out user's own review since it's shown above
                                if (userReview && r.id === userReview.id) return false;
                                return true;
                              })
                              .map((review) => (
                                <div key={review.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{review.user_name || 'Anonymous'}</p>
                                        <div className="flex items-center gap-1">
                                          {[1,2,3,4,5].map(s => (
                                            <StarIconSolid key={s} className={`w-4 h-4 ${s <= (review.rating||0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                          ))}
                                          <span className="ml-2 text-xs text-gray-500">({review.rating}/5)</span>
                                        </div>
                                      </div>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">{review.review_text || 'No review text provided.'}</p>
                                  </div>
                                  <div className="flex flex-col items-center justify-center gap-1 min-w-[60px] border-l border-gray-200 dark:border-gray-700 pl-4">
                                    <button 
                                      onClick={async () => {
                                        try {
                                          await reviewService.voteReview(String(review.id), 'up');
                                          await fetchReviewsWithFilters();
                                        } catch (err) { 
                                          console.error(err);
                                          alert((err as any)?.response?.data?.detail || 'Failed to vote');
                                        }
                                      }} 
                                      className="group hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded transition-colors"
                                      title="Upvote"
                                    >
                                      <svg className="w-5 h-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                      </svg>
                                    </button>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-medium text-green-600 dark:text-green-400">{review.upvotes || 0}</span>
                                      <span className="text-xs text-gray-400">|</span>
                                      <span className="text-xs font-medium text-red-600 dark:text-red-400">{review.downvotes || 0}</span>
                                    </div>
                                    <button 
                                      onClick={async () => {
                                        try {
                                          await reviewService.voteReview(String(review.id), 'down');
                                          await fetchReviewsWithFilters();
                                        } catch (err) { 
                                          console.error(err);
                                          alert((err as any)?.response?.data?.detail || 'Failed to vote');
                                        }
                                      }} 
                                      className="group hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-colors"
                                      title="Downvote"
                                    >
                                      <svg className="w-5 h-5 text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <p className="text-center text-gray-600 dark:text-gray-400 py-8">No reviews yet.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedTab === 'stats' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Average Rating Card */}
                          <div className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Average Rating</h3>
                              <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </div>
                            <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{(selectedBook.stats?.avgRating || 0).toFixed(1)}</div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Based on {reviews.length} reviews</p>
                          </div>

                          {/* Total Issues Card */}
                          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Times Issued</h3>
                              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{selectedBook.stats?.totalIssues || 0}</div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total times borrowed</p>
                          </div>

                          {/* Availability Card */}
                          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Availability</h3>
                              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">{selectedBook.available_copies || selectedBook.total_copies}</div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">of {selectedBook.total_copies} copies</p>
                          </div>
                        </div>

                        {/* eBook Issues Trend (Last 7 Days) - Line Graph */}
                        <div className="p-6 bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 rounded-lg border border-rose-200 dark:border-rose-700">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">eBook Issues Trend (Last 7 Days)</h3>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                            {ebookIssuesData && ebookIssuesData.length > 0 ? (
                              <svg viewBox="0 0 800 300" className="w-full h-64">
                                {(() => {
                                  const last7Days = ebookIssuesData.slice(-7);
                                  const maxCount = Math.max(...last7Days.map(d => d.count), 1);
                                  const padding = { top: 30, right: 40, bottom: 50, left: 50 };
                                  const width = 800 - padding.left - padding.right;
                                  const height = 300 - padding.top - padding.bottom;
                                  const pointSpacing = width / (last7Days.length - 1 || 1);

                                  // Calculate points for the line
                                  const points = last7Days.map((item, idx) => ({
                                    x: padding.left + idx * pointSpacing,
                                    y: padding.top + height - (item.count / maxCount) * height,
                                    count: item.count,
                                    date: new Date(item.date),
                                    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(item.date).getDay()],
                                    dateNum: new Date(item.date).getDate()
                                  }));

                                  // Create line path
                                  const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                                  // Create gradient fill area
                                  const areaPathData = `${pathData} L ${points[points.length - 1].x} ${padding.top + height} L ${points[0].x} ${padding.top + height} Z`;

                                  return (
                                    <>
                                      {/* Y-axis grid lines */}
                                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                                        <line
                                          key={`grid-${ratio}`}
                                          x1={padding.left}
                                          y1={padding.top + height * (1 - ratio)}
                                          x2={800 - padding.right}
                                          y2={padding.top + height * (1 - ratio)}
                                          stroke="currentColor"
                                          strokeWidth="1"
                                          opacity="0.1"
                                          className="text-gray-800"
                                        />
                                      ))}

                                      {/* Y-axis labels */}
                                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                                        <text
                                          key={`y-label-${ratio}`}
                                          x={padding.left - 15}
                                          y={padding.top + height * (1 - ratio) + 5}
                                          textAnchor="end"
                                          className="text-xs fill-gray-600 dark:fill-gray-400"
                                        >
                                          {Math.round(maxCount * ratio)}
                                        </text>
                                      ))}

                                      {/* Area under line */}
                                      <path
                                        d={areaPathData}
                                        fill="url(#lineGradient)"
                                        opacity="0.3"
                                      />

                                      {/* Gradient definition */}
                                      <defs>
                                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                          <stop offset="0%" stopColor="rgb(251, 146, 60)" stopOpacity="0.5" />
                                          <stop offset="100%" stopColor="rgb(251, 146, 60)" stopOpacity="0.1" />
                                        </linearGradient>
                                      </defs>

                                      {/* Line */}
                                      <path
                                        d={pathData}
                                        fill="none"
                                        stroke="rgb(251, 146, 60)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />

                                      {/* Data points and interactive areas */}
                                      {points.map((p, idx) => (
                                        <g key={`point-${idx}`} className="group cursor-pointer">
                                          {/* Invisible larger hover area */}
                                          <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r="20"
                                            fill="transparent"
                                            className="hover:opacity-20"
                                          />

                                          {/* Visible point */}
                                          <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r="5"
                                            fill="rgb(251, 146, 60)"
                                            stroke="white"
                                            strokeWidth="2"
                                            className="transition-all group-hover:r-7"
                                          />

                                          {/* Hover tooltip background */}
                                          <g>
                                            <rect
                                              x={p.x - 55}
                                              y={p.y - 45}
                                              width="110"
                                              height="35"
                                              rx="6"
                                              fill="rgb(17, 24, 39)"
                                              opacity="0"
                                              className="group-hover:opacity-95 transition-opacity"
                                            />

                                            {/* Tooltip text */}
                                            <text
                                              x={p.x}
                                              y={p.y - 30}
                                              textAnchor="middle"
                                              className="text-xs font-semibold fill-white group-hover:opacity-100 opacity-0 transition-opacity"
                                            >
                                              {p.day} {p.dateNum}
                                            </text>
                                            <text
                                              x={p.x}
                                              y={p.y - 15}
                                              textAnchor="middle"
                                              className="text-sm font-bold fill-orange-300 group-hover:opacity-100 opacity-0 transition-opacity"
                                            >
                                              {p.count} issues
                                            </text>
                                          </g>
                                        </g>
                                      ))}

                                      {/* X-axis labels */}
                                      {points.map((p, idx) => (
                                        <text
                                          key={`x-label-${idx}`}
                                          x={p.x}
                                          y={300 - 15}
                                          textAnchor="middle"
                                          className="text-xs fill-gray-600 dark:fill-gray-400"
                                        >
                                          {p.day}
                                        </text>
                                      ))}

                                      {/* X-axis */}
                                      <line
                                        x1={padding.left}
                                        y1={padding.top + height}
                                        x2={800 - padding.right}
                                        y2={padding.top + height}
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="stroke-gray-400 dark:stroke-gray-500"
                                      />

                                      {/* Y-axis */}
                                      <line
                                        x1={padding.left}
                                        y1={padding.top}
                                        x2={padding.left}
                                        y2={padding.top + height}
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="stroke-gray-400 dark:stroke-gray-500"
                                      />
                                    </>
                                  );
                                })()}
                              </svg>
                            ) : (
                              <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
                            )}
                          </div>
                        </div>

                        {/* Reviews Summary */}
                        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Review Breakdown</h3>
                          <div className="grid grid-cols-5 gap-2">
                            {[5, 4, 3, 2, 1].map(rating => {
                              const count = reviews.filter(r => r.rating === rating).length;
                              const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                              return (
                                <div key={rating} className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-2">
                                    <span className="text-sm font-medium">{rating}</span>
                                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                  </div>
                                  <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-end justify-center">
                                    <div 
                                      className="w-full bg-gradient-to-t from-purple-500 to-pink-400 transition-all"
                                      style={{ height: `${Math.max(percentage, 10)}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{count} ({percentage}%)</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit/Add Book Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            style={{ zIndex: 999999999, marginLeft: 0, left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-3xl my-8 relative z-[1000000000]"
              style={{ zIndex: 1000000000 }}
            >
              <Card className="overflow-hidden rounded-3xl">
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-between items-center mb-6 p-6 bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-800/50 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700"
                >
                  <div>
                    <h3 className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent text-2xl font-bold">
                      {selectedBook ? 'Edit Book' : 'Add New Book'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                      {selectedBook ? 'Update book information' : 'Add a new book to your library collection'}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowModal(false); setSelectedBook(null); }}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-all"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </motion.button>
                </motion.div>
                
                <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                  >
                    <motion.div 
                      className="md:col-span-2"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <Input 
                        type="text" 
                        placeholder="Enter book title"
                        value={formValues.title}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                        className="w-full shadow-sm" 
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Author</label>
                      <Input 
                        type="text" 
                        placeholder="Author's name"
                        value={formValues.author}
                        onChange={(e) => handleFormChange('author', e.target.value)}
                        className="shadow-sm" 
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">ISBN</label>
                      <Input 
                        type="text" 
                        placeholder="ISBN number"
                        value={formValues.isbn}
                        onChange={(e) => handleFormChange('isbn', e.target.value)}
                        className="shadow-sm" 
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select 
                        className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={formValues.category_id || ''}
                        onChange={(e) => handleFormChange('category_id', e.target.value ? Number(e.target.value) : undefined)}
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Status</label>
                      <select className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option value="available">Available</option>
                        <option value="issued">Issued</option>
                        <option value="reserved">Reserved</option>
                      </select>
                    </motion.div>

                    <motion.div
                      className="md:col-span-2"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px] p-2"
                        placeholder="Enter book description"
                        value={formValues.description || ''}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Cover URL</label>
                      <Input 
                        type="url" 
                        placeholder="Book cover image URL"
                        value={formValues.cover_url || ''}
                        onChange={(e) => handleFormChange('cover_url', e.target.value)}
                        className="shadow-sm"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Publisher</label>
                      <Input 
                        type="text" 
                        placeholder="Publisher name"
                        value={formValues.publisher || ''}
                        onChange={(e) => handleFormChange('publisher', e.target.value)}
                        className="shadow-sm"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <Input 
                        type="text" 
                        placeholder="Shelf location (e.g., Main - A1)"
                        value={(formValues as any).location || ''}
                        onChange={(e) => handleFormChange('location', e.target.value)}
                        className="shadow-sm"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Published Year</label>
                      <Input 
                        type="number" 
                        placeholder="Publication year"
                        value={formValues.publication_year || ''}
                        onChange={(e) => handleFormChange('publication_year', e.target.value ? Number(e.target.value) : undefined)}
                        className="shadow-sm"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <label className="block text-sm font-medium mb-2">Total Copies</label>
                      <Input 
                        type="number" 
                        placeholder="Total copies" 
                        min="1"
                        value={formValues.total_copies || 1}
                        onChange={(e) => handleFormChange('total_copies', Number(e.target.value))}
                        className="shadow-sm" 
                      />
                    </motion.div>

                    <motion.div 
                      className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="has_ebook"
                          checked={formValues.has_ebook || false}
                          onChange={(e) => handleFormChange('has_ebook', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors"
                        />
                        <label htmlFor="has_ebook" className="text-sm font-medium flex items-center space-x-2">
                          <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                          <span>This book has an e-book version</span>
                        </label>
                      </div>

                      <div className="pl-7">
                        {/* Admin-only: allow uploading an ebook file instead of entering a URL */}
                        {isAdminUser && (formValues.has_ebook || false) && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium mb-1">Upload e-Book file</label>
                            <input
                              type="file"
                              accept=".pdf,.epub,.mobi"
                              onChange={(e) => {
                                const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                                setEbookFile(f);
                              }}
                            />
                            {ebookFile && <p className="mt-2 text-xs text-green-600">Selected: {ebookFile.name}</p>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                <motion.div 
                  className="flex justify-end items-center gap-3 p-6 bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-800/50 dark:to-orange-900/20 mt-6 border-t border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowModal(false); setSelectedBook(null); }}
                    className="px-6 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    {selectedBook ? 'Update Book' : 'Add Book'}
                  </motion.button>
                </motion.div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
};