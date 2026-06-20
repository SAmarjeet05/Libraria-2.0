import React, { useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { borrowService, type BorrowRecord } from '../../../services/borrowService';
import { useAuth } from '../../../hooks/useAuth';
import { Book as BookType } from '../../../services/bookService';
import { useState } from 'react';

type GroupedItem = {
  bookId: string;
  title: string;
  book?: Partial<BookType> | null;
  occurrences: BorrowRecord[]; // all borrow records for this book
  currentStatus: string; // 'borrowed'|'returned'|'overdue'
  latestDue?: string;
};

export const MyBooksView: React.FC = () => {
  const auth = useAuth();
  const [groups, setGroups] = useState<GroupedItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'borrowed' | 'returned' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'due' | 'status'>('due');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeHistory, setActiveHistory] = useState<GroupedItem | null>(null);
  const [failedCovers, setFailedCovers] = useState<Record<string, boolean>>({});
  const [overrideSrc, setOverrideSrc] = useState<Record<string, string>>({});

  const hasValidCover = (url: any) => {
    if (!url || typeof url !== 'string') return false;
    const s = url.trim();
    if (!s) return false;
    if (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return false;
    return true;
  };

  const formatRelative = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const abs = Math.abs(diff);
    const sec = Math.floor(abs / 1000);
    if (sec < 60) return diff >= 0 ? 'in a few seconds' : 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return diff >= 0 ? `in ${min} minute${min === 1 ? '' : 's'}` : `${min} minute${min === 1 ? '' : 's'} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return diff >= 0 ? `in ${hr} hour${hr === 1 ? '' : 's'}` : `${hr} hour${hr === 1 ? '' : 's'} ago`;
    const days = Math.floor(hr / 24);
    if (days < 30) return diff >= 0 ? `in ${days} day${days === 1 ? '' : 's'}` : `${days} day${days === 1 ? '' : 's'} ago`;
    // fallback to month/year
    const months = Math.floor(days / 30);
    if (months < 12) return diff >= 0 ? `in ${months} month${months === 1 ? '' : 's'}` : `${months} month${months === 1 ? '' : 's'} ago`;
    const yrs = Math.floor(months / 12);
    return diff >= 0 ? `in ${yrs} year${yrs === 1 ? '' : 's'}` : `${yrs} year${yrs === 1 ? '' : 's'} ago`;
  };

  // If groups change (new data from server), clear any failedCovers for books that now have a cover_url
  useEffect(() => {
    const idsWithCover: string[] = groups
      .filter(g => hasValidCover(g.book?.cover_url))
      .map(g => g.bookId);
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
    // Also clear any overrideSrc for these ids so we try the primary URL first
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
  }, [groups]);

  useEffect(() => {
    const load = async () => {
      try {
        const userId = auth.user?.id || JSON.parse(localStorage.getItem('libraria_auth') || 'null')?.user?.id;
        if (!userId) return;
        const records: BorrowRecord[] = await borrowService.getUserBorrows(String(userId));

        // Group by book_id
        const map = new Map<string, BorrowRecord[]>();
        records.forEach(r => {
          const bid = String(r.book_id);
          if (!map.has(bid)) map.set(bid, []);
          map.get(bid)!.push(r);
        });

        const grouped: GroupedItem[] = [];
        for (const [bookId, recs] of map.entries()) {
          // sort recs by borrowed_at ascending
          recs.sort((a, b) => new Date(a.borrowed_at).getTime() - new Date(b.borrowed_at).getTime());
          const latest = recs[recs.length - 1];
          const currentStatus = latest.returned_at || latest.status === 'returned' ? 'returned' : (new Date(latest.due_date) < new Date() ? 'overdue' : 'borrowed');
          grouped.push({
            bookId,
            title: latest.book?.title || `Book ${bookId}`,
            book: latest.book || null,
            occurrences: recs,
            currentStatus,
            latestDue: latest.due_date
          });
        }

        setGroups(grouped);
        // Force proxy usage for MyBooks view to avoid CORS/mixed-content issues
        try {
          const api = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const proxMap: Record<string, string> = {};
          grouped.forEach(g => {
            const cover = g.book?.cover_url;
            if (hasValidCover(cover)) {
              proxMap[g.bookId] = `${api}/proxy/image?url=${encodeURIComponent(cover as string)}`;
            }
          });
          if (Object.keys(proxMap).length) setOverrideSrc(prev => ({ ...prev, ...proxMap }));
        } catch (e) {
          console.debug('[MyBooks] failed to set proxy map', e);
        }
      } catch (err) {
        console.error('Failed to load my borrows', err);
      }
    };

    load();
  }, [auth.user]);

  // Partition into active and returned groups, sort by due date asc
  const partitionAndSortGroups = (list: GroupedItem[]) => {
    const active = list.filter(g => g.currentStatus !== 'returned');
    const returned = list.filter(g => g.currentStatus === 'returned');
    const sortByDue = (a: GroupedItem, b: GroupedItem) => new Date(a.latestDue || 0).getTime() - new Date(b.latestDue || 0).getTime();
    active.sort(sortByDue);
    returned.sort(sortByDue);
    return [...active, ...returned];
  };

  const filtered = groups.filter(g => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'borrowed') return g.currentStatus === 'borrowed';
    if (filterStatus === 'returned') return g.currentStatus === 'returned';
    if (filterStatus === 'overdue') return g.currentStatus === 'overdue';
    return true;
  });

  let displayed = partitionAndSortGroups(filtered);

  if (sortBy === 'status') {
    const order = (it: GroupedItem) => {
      if (it.currentStatus === 'overdue') return 0;
      if (it.currentStatus === 'borrowed') return 1;
      return 2; // returned
    };
    displayed = [...displayed].sort((a, b) => {
      const oa = order(a), ob = order(b);
      if (oa !== ob) return oa - ob;
      return new Date((a.latestDue || '')).getTime() - new Date((b.latestDue || '')).getTime();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-1">My Books</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">View your borrowed books and their due dates.</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm">Filter:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="rounded-md border px-2 py-1">
              <option value="all">All</option>
              <option value="borrowed">Borrowed</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
            </select>

            <label className="text-sm">Sort:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rounded-md border px-2 py-1">
              <option value="due">Due Date</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {displayed.map(group => (
          <Card key={group.bookId} hover>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                  {hasValidCover(group.book?.cover_url) && !failedCovers[group.bookId] ? (
                    <div className="mb-0">
                      <img
                        src={overrideSrc[group.bookId] || group.book?.cover_url || ''}
                        alt={group.title}
                        className="w-20 h-28 object-cover rounded-md"
                        loading="lazy"
                        decoding="async"
                        onLoad={() => {
                          // clear any previous failure mark
                          setFailedCovers(prev => {
                            if (!prev[group.bookId]) return prev;
                            const next = { ...prev };
                            delete next[group.bookId];
                            return next;
                          });
                        }}
                        onError={(e) => {
                          const cover = group.book?.cover_url || '';
                          console.error('[mybooks cover] failed to load', group.bookId, cover, e);
                          // If we haven't tried the proxy yet, set override to proxy URL and retry once
                          if (!overrideSrc[group.bookId] && cover) {
                            const api = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                            const prox = `${api}/proxy/image?url=${encodeURIComponent(cover)}`;
                            setOverrideSrc(prev => ({ ...prev, [group.bookId]: prox }));
                            // clearing failed flag so image will attempt reload with new src
                            setFailedCovers(prev => {
                              const next = { ...prev };
                              delete next[group.bookId];
                              return next;
                            });
                            console.debug('[mybooks cover] retrying via proxy', group.bookId, prox);
                            return;
                          }
                          setFailedCovers(prev => ({ ...prev, [group.bookId]: true }));
                        }}
                      />
                    </div>
                  ) : (
                  <div className="w-20 h-28 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{group.title}</h3>
                  {group.currentStatus !== 'returned' ? (
                    // Highlight due date for active borrows
                    (() => {
                      const now = new Date();
                      const due = group.latestDue ? new Date(group.latestDue) : null;
                      if (!due) return (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Due: N/A</p>
                      );
                      const msPerDay = 1000 * 60 * 60 * 24;
                      const diff = Math.ceil((due.getTime() - now.getTime()) / msPerDay);
                      let badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                      let label = `Due: ${due.toLocaleDateString()}`;
                      if (due.getTime() < now.getTime()) {
                        badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                        label = `Overdue • ${due.toLocaleDateString()}`;
                      } else if (diff <= 3) {
                        badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                        label = `Due Soon • ${due.toLocaleDateString()}`;
                      }
                      return (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}>
                            {label}
                          </span>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{group.occurrences.length > 1 ? `${group.occurrences.length} past issue(s)` : '1 issue'}</div>
                        </div>
                      );
                    })()
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Returned • Last due: {group.latestDue ? new Date(group.latestDue).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{group.occurrences.length > 1 ? `• ${group.occurrences.length} times` : ''}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                  onClick={() => { setActiveHistory(group); setHistoryOpen(true); }}
                >
                  View History
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* History Modal */}
      {historyOpen && activeHistory && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">History — {activeHistory.title}</h3>
              <button onClick={() => setHistoryOpen(false)} className="text-sm text-gray-600">Close</button>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-3">Issued {activeHistory.occurrences.length} time(s). Below are entries:</p>
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {(() => {
                  // Order occurrences: currently active (not returned) first (if any), then past occurrences ordered by borrowed_at most-recent-first
                  const occ = activeHistory.occurrences.slice();
                  // find active (not returned) entries
                  const activeOnes = occ.filter(o => !o.returned_at);
                  // past ones (returned) sorted by borrowed_at desc
                  const pastOnes = occ.filter(o => !!o.returned_at).sort((a, b) => new Date(b.borrowed_at).getTime() - new Date(a.borrowed_at).getTime());
                  // If there are multiple active ones, sort them by borrowed_at ascending (so earliest active first) or keep as-is
                  activeOnes.sort((a, b) => new Date(a.borrowed_at).getTime() - new Date(b.borrowed_at).getTime());
                  const ordered = [...activeOnes, ...pastOnes];
                  return ordered.map((o) => {
                    const isActive = !o.returned_at;
                    return (
                      <li key={o.id} className="p-2 border border-gray-100 dark:border-gray-800 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-700 dark:text-gray-300">Borrowed: {new Date(o.borrowed_at).toLocaleString()}
                            <span className="ml-2 text-xs text-gray-500">{formatRelative(o.borrowed_at)}</span>
                          </div>
                          {isActive && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              Currently borrowed
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Due: {new Date(o.due_date).toLocaleDateString()} <span className="ml-2">{formatRelative(o.due_date)}</span> {o.returned_at ? `• Returned: ${new Date(o.returned_at).toLocaleDateString()}` : ''}</div>
                      </li>
                    );
                  });
                })()}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};