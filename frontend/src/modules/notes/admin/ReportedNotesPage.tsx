import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';

type ReportItem = {
  report_id: number | string;
  note_id: number | string;
  title: string | null;
  reason: string | null;
  reported_by: string | null;
  status: string | null;
  admin_response?: string | null;
  created_at?: string | null;
};

const ReportedNotesPage: React.FC = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // If hook token is not yet available (race on initial render), try localStorage fallback
      let authToken = token;
      if (!authToken) {
        try {
          const saved = localStorage.getItem('libraria_auth');
          if (saved) {
            const parsed = JSON.parse(saved as string);
            authToken = parsed?.token || parsed?.access_token || null;
          }
        } catch (e) {
          // ignore
        }
      }

      const res = await fetch('/api/notes/reports', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (!res.ok) {
        const txt = await res.text();
        // If backend says not authenticated, attempt one retry using localStorage token
        if (res.status === 401 && txt && txt.toLowerCase().includes('not authenticated')) {
          // try localStorage token if we didn't already
          const saved = localStorage.getItem('libraria_auth');
          if (saved) {
            try {
              const parsed = JSON.parse(saved as string);
              const fallback = parsed?.token || parsed?.access_token || null;
              if (fallback && fallback !== authToken) {
                const retry = await fetch('/api/notes/reports', {
                  headers: { Authorization: `Bearer ${fallback}` }
                });
                if (retry.ok) {
                  const j2 = await retry.json();
                  setReports(j2 || []);
                  setLoading(false);
                  return;
                }
              }
            } catch (e) {}
          }
        }
        throw new Error(txt || res.statusText);
      }
      const j = await res.json();
      setReports(j || []);
    } catch (err: any) {
      console.error('Failed to load reports', err);
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (reportId: number | string) => {
    const response = window.prompt('Enter an optional admin response (leave empty to just resolve):');
    // If the user cancelled the prompt, `response` will be `null`.
    // Do not proceed with resolving the report in that case.
    if (response === null) return;
    try {
      const res = await fetch(`/api/notes/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ admin_response: response })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
      }
      await fetchReports();
    } catch (err: any) {
      console.error('Failed to resolve report', err);
      alert('Failed to resolve report: ' + (err?.message || 'unknown'));
    }
  };

  const handleRemoveNote = async (noteId: number | string) => {
    if (!confirm('Are you sure you want to permanently delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${noteId}/delete`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok && res.status !== 204) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
      }
      // Refresh the reports list after deletion
      await fetchReports();
    } catch (err: any) {
      console.error('Failed to delete note', err);
      alert('Failed to delete note: ' + (err?.message || 'unknown'));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 dark:text-white">Reported Notes</h2>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="space-y-6 mt-3">
        {/* Partition reports into pending (non-resolved) and resolved */}
        {reports.length === 0 && !loading && (
          <div className="text-sm text-gray-500">No reported notes found.</div>
        )}

        {/* Prepare sorted arrays in arrival order (oldest first) */}
        {(() => {
          const safeDate = (d?: string | null) => {
            try {
              return d ? new Date(d) : new Date(0);
            } catch (e) {
              return new Date(0);
            }
          };

          const sorted = [...reports].sort((a, b) => {
            const da = safeDate(a.created_at).getTime();
            const db = safeDate(b.created_at).getTime();
            return da - db; // arrival order: oldest -> newest
          });

          const pending = sorted.filter(r => String(r.status).toLowerCase() !== 'resolved');
          const resolved = sorted.filter(r => String(r.status).toLowerCase() === 'resolved');

          return (
            <>
              <div>
                <h3 className="text-lg font-medium mb-2">Pending Reports ({pending.length})</h3>
                <div className="space-y-3">
                  {pending.map(r => (
                    <Card key={String(r.report_id)} className="p-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{r.title || `#${r.note_id}`}</h3>
                        <p className="text-sm text-gray-500">Reported by {r.reported_by || 'Unknown'} • {r.reason}</p>
                        <p className="text-xs text-gray-400">Status: {r.status || 'pending'} • {r.created_at}</p>
                        {r.admin_response && <p className="text-sm text-green-600">Admin: {r.admin_response}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => handleResolve(r.report_id)}>Resolve</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mt-6 mb-2">Resolved Reports ({resolved.length})</h3>
                <div className="space-y-3">
                  {resolved.map(r => (
                    <Card key={String(r.report_id)} className="p-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{r.title || `#${r.note_id}`}</h3>
                        <p className="text-sm text-gray-500">Reported by {r.reported_by || 'Unknown'} • {r.reason}</p>
                        <p className="text-xs text-gray-400">Resolved at: {r.created_at}</p>
                        {r.admin_response && <p className="text-sm text-green-600">Admin: {r.admin_response}</p>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default ReportedNotesPage;
