import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { StarIcon, BookOpenIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { recommendationService } from '../../../services/bookService';

interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  cover_url?: string;
  category_id?: number;
  has_ebook: boolean;
  status: string;
  popularity: number;
}

interface RecommendationsResponse {
  recommendations: RecommendedBook[];
  reason: string;
  activity_count?: number;
  interested_categories?: number;
  activity_breakdown?: any;
}

export const RecommendedBooksSection: React.FC<{ onBookClick?: (bookId: string) => void }> = ({ onBookClick }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const result: RecommendationsResponse = await recommendationService.getRecommendedBooks(8);
        setRecommendations(result.recommendations || []);
        setReason(result.reason || '');
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setRecommendations([]);
        setReason('error');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleBookClick = (bookId: string) => {
    if (onBookClick) {
      onBookClick(bookId);
    }
  };

  // New user with no activity
  if (!loading && reason === 'new_user') {
    return (
      <div className="py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Recommended For You</h2>
            <p className="text-gray-600 dark:text-amber-100">Get started by exploring books</p>
          </div>
          <Button 
            variant="outlined" 
            size="sm"
            onClick={() => navigate('books')}
            className="flex items-center gap-2"
          >
            Explore
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
        <Card className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-amber-200 mb-2">
            No Recent Activity
          </h3>
          <p className="text-gray-600 dark:text-amber-100 mb-4">
            Start exploring the library to get personalized recommendations!
          </p>
          <p className="text-sm text-gray-500 dark:text-amber-50">
            Browse books, add them to your wishlist, or borrow them to see recommendations tailored to your interests.
          </p>
        </Card>
      </div>
    );
  }

  // No recommendations found (but user has activity)
  if (!loading && recommendations.length === 0 && reason !== 'new_user') {
    return (
      <div className="py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Recommended For You</h2>
            <p className="text-gray-600 dark:text-amber-100">No recommendations yet</p>
          </div>
          <Button 
            variant="outlined" 
            size="sm"
            onClick={() => navigate('books')}
            className="flex items-center gap-2"
          >
            Explore
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
        <Card className="text-center py-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-amber-200 mb-2">
            Explore More Books
          </h3>
          <p className="text-gray-600 dark:text-amber-100 mb-6">
            No available books matching your interests right now. Explore our full catalog to discover more!
          </p>
          <Button onClick={() => navigate('books')}>
            Explore Books
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Recommended For You</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-40 rounded-lg mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Display recommendations
  return (
    <div className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Recommended For You</h2>
          <p className="text-gray-600 dark:text-amber-100">
            Based on your interests and popular choices in your favorite categories
          </p>
        </div>
        <Button 
          variant="outlined" 
          size="sm"
          onClick={() => navigate('books')}
          className="flex items-center gap-2"
        >
          Explore All
          <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recommendations.map((book, index) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="cursor-pointer group"
            onClick={() => handleBookClick(book.id)}
          >
            <Card hover className="h-full flex flex-col overflow-hidden">
              {/* Cover Image */}
              <div className="relative h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden mb-3">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900 dark:to-blue-900">
                    <BookOpenIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                )}

                {/* Popularity Badge */}
                <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 flex items-center gap-1 shadow-md">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {(book.popularity * 100).toFixed(0)}%
                  </span>
                </div>

                {/* eBook Badge */}
                {book.has_ebook && (
                  <div className="absolute bottom-2 left-2 bg-blue-600 text-white rounded px-2 py-1 text-xs font-semibold">
                    eBook
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1 text-gray-900 dark:text-white">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                  {book.author}
                </p>

                {/* Action Button */}
                <div className="mt-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full flex items-center justify-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookClick(book.id);
                    }}
                  >
                    View
                    <ArrowRightIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      {recommendations.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button variant="outlined">
            View All Recommendations
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};
