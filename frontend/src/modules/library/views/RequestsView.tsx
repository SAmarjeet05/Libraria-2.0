import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import { bookRequestService } from '../../../services/bookRequestService';
import { bookService } from '../../../services/bookService';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const RequestsView: React.FC = () => {
  const { hasRole, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const fetchUsersByIds = async (ids: string[]) => {
    const missing = ids.filter(id => id && !userMap[id]);
    // require an auth token for user details (admin only)
    if (!token) return {} as Record<string, string>;
    if (missing.length === 0) return {} as Record<string, string>;
    const next: Record<string, string> = {};
    await Promise.all(missing.map(async (id) => {
      try {
        const resp = await fetch(`/api/users/${id}`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!resp.ok) {
          // don't throw; map to id so UI remains functional
          next[id] = String(id);
          return;
        }
        const j = await resp.json();
        const name = j.full_name || j.username || j.email || String(id);
        next[id] = name;
      } catch (e) {
        // ignore individual fetch failures
        next[id] = String(id);
      }
    }));
    setUserMap(prev => ({ ...prev, ...next }));
    return next;
  };

  const load = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const rows = await bookRequestService.listRequests();
      // enrich with book title when book_id present
      const withBooks = await Promise.all((rows || []).map(async (r: any) => {
        // resolve book title when possible
        let book_title = null;
        if (r.book_id) {
          try {
            const b = await bookService.getBook(String(r.book_id));
            book_title = b.title;
          } catch (e) {
            book_title = null;
          }
        }
        return { ...r, book_title };
      }));

      // fetch user names for all requests and apply immediately
      const userIds = Array.from(new Set((withBooks || []).map((r: any) => String(r.user_id)).filter(Boolean)));
      const resolved = await fetchUsersByIds(userIds);
      setRequests(withBooks.map(r => ({ ...r, user_name: resolved[String(r.user_id)] || userMap[String(r.user_id)] || null })));
    } catch (e) {
      console.error('Failed to load requests', e);
      const msg = (e as any)?.message || (e as any)?.response?.data?.detail || String(e);
      setErrorMessage(msg);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  // Filter requests based on search term
  const filteredRequests = requests.filter(request => {
    if (!activeSearch) return true;
    const searchLower = activeSearch.toLowerCase();
    const userName = (request.user_name || request.user_id || '').toLowerCase();
    const bookTitle = (request.book_title || '').toLowerCase();
    return userName.includes(searchLower) || bookTitle.includes(searchLower);
  });

  const handleAction = async (request: any, action: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
      // If approving, first call the borrow/issue route to create the borrow record
      if (action === 'approved' && request.book_id) {
        if (!token) throw new Error('Missing auth token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const url = `${apiBase}/borrows/issue/${request.book_id}?user_id=${request.user_id}&days=14`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        if (!resp.ok) {
          const body = await resp.text();
          throw new Error(`Failed to issue book: ${resp.status} ${resp.statusText} - ${body}`);
        }
        // book issued successfully, now update the request status on server
        await bookRequestService.updateStatus(request.id, action);
      } else {
        // For reject or requests without book_id, just update status
        await bookRequestService.updateStatus(request.id, action);
      }

      await load();
    } catch (e) {
      console.error('Failed to update request', e);
      alert(`Update failed: ${(e as any)?.message || e}`);
    }
  };

  if (!hasRole('Admin')) {
    return <div className="text-center py-12">Admin only</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">Book Requests</h2>
        <p>Approve or reject requests from users to add or issue books.</p>
      </Card>

      {/* Search Bar */}
      <Card>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by user name or book title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveSearch(searchTerm);
                }
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="filled" onClick={() => setActiveSearch(searchTerm)}>Search</Button>
            <Button size="sm" variant="outlined" onClick={() => { setSearchTerm(''); setActiveSearch(''); }}>Clear</Button>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-center py-6">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            {errorMessage && (
              <div className="p-3 mb-3 bg-red-50 text-red-700 rounded text-sm">Failed to load requests: {errorMessage}</div>
            )}
            <table className="min-w-full text-left">
              <thead>
                <tr>
                  <th className="px-4 py-2">Submitter</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2 align-top text-sm">{r.user_name || r.user_id || '-'}</td>
                    <td className="px-4 py-2 align-top text-sm">{r.book_title || r.book_id || '-'}</td>
                    <td className="px-4 py-2 align-top text-sm">
                      {r.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => handleAction(r, 'approved')}>Approve</button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => handleAction(r, 'rejected')}>Reject</button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      {activeSearch ? 'No requests match your search.' : 'No requests found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
