import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { wishlistService, type WishlistItem } from '../../../services/wishlistService';
import { bookService, type Book } from '../../../services/bookService';

interface CombinedWishlistBook {
  id: number; // wishlist item id
  addedAt?: string | null;
  status: string;
  notes?: string | null;
  book?: Book | null;
}

export const WishlistView: React.FC = () => {
  const [wishlist, setWishlist] = useState<CombinedWishlistBook[]>([]);
  const [overrideSrc, setOverrideSrc] = useState<Record<string, string>>({});

  const hasValidCover = (url: any) => {
    if (!url || typeof url !== 'string') return false;
    const s = url.trim();
    if (!s) return false;
    if (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return false;
    return true;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const items = await wishlistService.getWishlist();
        const combined = await Promise.all(items.map(async (it: WishlistItem) => {
          let book: Book | null = null;
          try {
            book = await bookService.getBook(it.book_id);
          } catch (err) {
            console.warn('Failed to fetch book for wishlist item', it.book_id, err);
          }
          return {
            id: it.id,
            addedAt: it.added_at,
            status: it.status,
            notes: it.notes,
            book
          } as CombinedWishlistBook;
        }));
        setWishlist(combined);
      } catch (err) {
        console.error('Failed to load wishlist', err);
      }
    };

    load();
  }, []);

  const removeFromWishlist = async (id: number) => {
    try {
      // Instead of deleting, mark the wishlist item as removed
      const updated = await wishlistService.updateWishlistItem(id, { status: 'removed' });
      setWishlist(prev => prev.map(it => it.id === id ? { ...it, status: updated.status } : it));
    } catch (err) {
      console.error('Failed to mark wishlist item removed', err);
      alert('Failed to remove wishlist item');
    }
  };

  const borrowBook = async (bookId: string | undefined) => {
    if (!bookId) return;
    try {
      await bookService.updateBook(bookId, { status: 'reserved' });
      alert('Borrow request placed');
      // Optionally refresh wishlist or books elsewhere
    } catch (err) {
      console.error('Error borrowing book:', err);
      alert('Failed to borrow book');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">My Wishlist</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Keep track of books you'd like to read
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.filter(it => it.status !== 'removed').map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    {hasValidCover(item.book?.cover_url) ? (
                      <img
                        src={overrideSrc[item.id] || item.book?.cover_url || ''}
                        alt={item.book?.title || ''}
                        className="w-20 h-28 object-cover rounded-md"
                        loading="lazy"
                        decoding="async"
                        onLoad={() => console.debug('[wishlist cover] loaded', item.id, item.book?.cover_url)}
                        onError={(e) => {
                          const cover = item.book?.cover_url || '';
                          console.error('[wishlist cover] failed', item.id, cover, e);
                          if (!overrideSrc[item.id] && cover) {
                            const api = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                            const prox = `${api}/proxy/image?url=${encodeURIComponent(cover)}`;
                            setOverrideSrc(prev => ({ ...prev, [item.id]: prox }));
                            console.debug('[wishlist cover] retrying via proxy', item.id, prox);
                            return;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.book?.title || `Book ${item.book?.id || ''}`}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">by {item.book?.author || 'Unknown'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <HeartIcon className="w-4 h-4 mr-1" />
                    <span>Added {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={item.book?.status === 'available' ? 'primary' : 'secondary'}
                    disabled={!(item.book?.status === 'available')}
                    onClick={() => borrowBook(item.book?.id)}
                  >
                    {item.book?.status === 'available' ? 'Borrow' : 'Not Available'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {wishlist.filter(it => it.status !== 'removed').length === 0 && (
        <div className="text-center py-12">
          <HeartIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start adding books you'd like to read in the future
          </p>
        </div>
      )}
    </div>
  );
};