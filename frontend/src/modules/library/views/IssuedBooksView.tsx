import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../hooks/useAuth';

interface Book {
  id: string;
  title: string;
  isbn: string;
  available_copies: number;
}

interface UserData {
  id: string;
  full_name: string;
  email: string;
}

interface BorrowRecord {
  id: string;
  book_id: string;
  user_id: string;
  borrowed_at: string;
  due_date: string;
  return_date: string | null;
  status: 'active' | 'returned' | 'overdue';
  book: {
    title: string;
    isbn: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export const IssuedBooksView: React.FC = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned' | 'overdue'>('all');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [bookId, setBookId] = useState('');
  const [userId, setUserId] = useState('');
  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [userDetails, setUserDetails] = useState<UserData | null>(null);
  const [bookError, setBookError] = useState('');
  const [userError, setUserError] = useState('');
  const [loanDays, setLoanDays] = useState<number>(14);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords();
  }, []);

  // Debounced verification function for book ID
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const verifyBook = async () => {
      if (!bookId || bookId.trim().length === 0) {
        setBookDetails(null);
        setBookError('');
        return;
      }

      setIsVerifying(true);
      try {
        const authData = localStorage.getItem('libraria_auth');
        if (!authData) {
          throw new Error('No authentication data found');
        }

        const parsedAuthData = JSON.parse(authData);
        if (!parsedAuthData.token) {
          throw new Error('No authentication token found');
        }

        // Format book ID if it's in the 32-character format without hyphens
        let formattedBookId = bookId.trim();
        if (formattedBookId.length === 32 && !formattedBookId.includes('-')) {
          formattedBookId = `${formattedBookId.slice(0,8)}-${formattedBookId.slice(8,12)}-${formattedBookId.slice(12,16)}-${formattedBookId.slice(16,20)}-${formattedBookId.slice(20)}`;
        }

        const response = await fetch(`/api/books/${formattedBookId}`, {
          headers: {
            'Authorization': `Bearer ${parsedAuthData.token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Book not found';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', errorText);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (data.available_copies > 0) {
          setBookDetails(data);
          setBookError('');
        } else {
          setBookDetails(null);
          setBookError('No copies available');
        }
      } catch (error) {
        setBookDetails(null);
        setBookError(error instanceof Error ? error.message : 'Error verifying book');
        console.error('Book verification error:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    // Only trigger verification if bookId has actual content
    if (bookId.trim().length > 0) {
      timeoutId = setTimeout(verifyBook, 500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [bookId]);

  // Debounced verification function for user ID
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const verifyUser = async () => {
      if (!userId || userId.trim().length === 0) {
        setUserDetails(null);
        setUserError('');
        return;
      }

      setIsVerifying(true);
      try {
        const authData = localStorage.getItem('libraria_auth');
        if (!authData) {
          throw new Error('No authentication data found');
        }

        const parsedAuthData = JSON.parse(authData);
        if (!parsedAuthData.token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/users/${userId.trim()}`, {
          headers: {
            'Authorization': `Bearer ${parsedAuthData.token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'User not found';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', errorText);
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setUserDetails(data);
        setUserError('');
      } catch (error) {
        setUserDetails(null);
        setUserError(error instanceof Error ? error.message : 'Error verifying user');
        console.error('User verification error:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    // Only trigger verification if userId has actual content
    if (userId.trim().length > 0) {
      timeoutId = setTimeout(verifyUser, 500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [userId]);

  const handleIssueBook = async () => {
    if (!bookDetails || !userDetails) {
      alert('Please verify both book and user');
      return;
    }

    try {
      const authData = localStorage.getItem('libraria_auth');
      if (!authData) {
        throw new Error('No authentication data found');
      }

      const { token } = JSON.parse(authData);
      const response = await fetch(`/api/borrows/issue/${bookDetails.id}?user_id=${userDetails.id}&days=${loanDays}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      let errorMessage = 'Failed to issue book';
      if (response.ok) {
        await response.json();
        setIsIssueModalOpen(false);
        setBookId('');
        setUserId('');
        setBookDetails(null);
        setUserDetails(null);
        setLoanDays(14);
        await fetchRecords();
      } else {
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error issuing book:', error);
      alert('Failed to issue book');
    }
  };

  const fetchRecords = async () => {
    try {
      const authData = localStorage.getItem('libraria_auth');
      if (!authData) {
        throw new Error('No authentication data found');
      }

      const { token } = JSON.parse(authData);
      const response = await fetch('/api/borrows', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (recordId: string) => {
    try {
      const authData = localStorage.getItem('libraria_auth');
      if (!authData) {
        throw new Error('No authentication data found');
      }

      const { token } = JSON.parse(authData);
      const response = await fetch(`/api/borrows/return/${recordId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchRecords(); // Refresh the list
      }
    } catch (error) {
      console.error('Error returning book:', error);
    }
  };

  const handleExtend = async (recordId: string) => {
    try {
      const daysStr = window.prompt('Enter number of days to extend (e.g. 7):', '7');
      if (!daysStr) return; // user cancelled
      const days = parseInt(daysStr, 10);
      if (isNaN(days) || days <= 0) {
        alert('Invalid number of days');
        return;
      }

      const authData = localStorage.getItem('libraria_auth');
      if (!authData) {
        throw new Error('No authentication data found');
      }

      const { token } = JSON.parse(authData);
      const response = await fetch(`/api/borrows/extend/${recordId}?days=${days}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchRecords();
      } else {
        const text = await response.text();
        let msg = 'Could not extend loan';
        try {
          const j = JSON.parse(text);
          msg = j.detail || msg;
        } catch (e) {
          console.error('Error parsing extend error response:', text);
        }
        alert(msg);
      }
    } catch (error) {
      console.error('Error extending loan:', error);
      alert('Failed to extend loan');
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  };

  const filteredRecords = records.filter(record => {
    const q = (activeSearch || search).trim().toLowerCase();
    if (!q) return true;
    return (
      (record.book?.title || '').toLowerCase().includes(q) ||
      (record.book?.isbn || '').toLowerCase().includes(q) ||
      (record.user?.name || '').toLowerCase().includes(q)
    );
  });

  if (!user || user.role !== 'Admin') {
    return <div>Access Denied: Admin privileges required.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Issued Books</h2>
          <div className="flex gap-4 items-center">
            <Input
              type="text"
              placeholder="Search books, ISBN, or borrowers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
              onKeyDown={(e) => { if (e.key === 'Enter') setActiveSearch(search); }}
            />
            <Button size="sm" onClick={() => setActiveSearch(search)}>Search</Button>
            <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setActiveSearch(''); }}>Clear</Button>
            <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-10" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsIssueModalOpen(true)}
            >
              Issue New Book
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredRecords.filter(r => statusFilter === 'all' ? true : r.status === statusFilter).map((record) => (
            <Card key={record.id} hover className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-semibold">{record.book?.title ?? 'Unknown title'}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ISBN: {record.book?.isbn ?? '—'} • Borrowed by: {record.user?.name ?? '—'}
                  </p>
                  <div className="flex gap-4 text-xs">
                    <span>Issued: {formatDate(record.borrowed_at)}</span>
                    <span>Due: {formatDate(record.due_date)}</span>
                    {record.return_date && (
                      <span>Returned: {formatDate(record.return_date)}</span>
                    )}
                  </div>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                    ${record.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      record.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                    {record.status.toUpperCase()}
                  </div>
                </div>
                {record.status === 'active' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReturn(record.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Return Book
                    </Button>
                    <Button
                      onClick={() => handleExtend(record.id)}
                      variant="ghost"
                      size="sm"
                    >
                      Extend
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Issue Book Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">Issue New Book</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Book ID</label>
                <Input
                  type="text"
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  className={`
                    ${bookDetails ? 'border-green-500 focus:ring-green-500' : ''}
                    ${bookError ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  placeholder="Enter book ID"
                />
                {bookDetails && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    Found: {bookDetails.title} ({bookDetails.available_copies} copies available)
                  </p>
                )}
                {bookError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {bookError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <Input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className={`
                    ${userDetails ? 'border-green-500 focus:ring-green-500' : ''}
                    ${userError ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  placeholder="Enter user ID"
                />
                {userDetails && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    Found: {userDetails.full_name} ({userDetails.email})
                  </p>
                )}
                {userError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {userError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Duration (days)</label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={loanDays}
                  onChange={(e) => setLoanDays(parseInt(e.target.value) || 14)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setIsIssueModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleIssueBook}
                  disabled={!bookDetails || !userDetails || isVerifying}
                >
                  {isVerifying ? 'Verifying...' : 'Issue Book'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};