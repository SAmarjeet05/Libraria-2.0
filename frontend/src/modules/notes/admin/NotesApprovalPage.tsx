import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import FileViewer from '../../../components/FileViewer';

const RejectedNotesPage: React.FC = () => {
  const { token } = useAuth() as any;
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewType, setPreviewType] = useState<string>('');

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      let usedToken = token;
      if (!usedToken) {
        try {
          const saved = localStorage.getItem('libraria_auth');
          if (saved) {
            const parsed = JSON.parse(saved);
            usedToken = parsed?.token || parsed?.access_token || null;
          }
        } catch (e) { /* ignore */ }
      }
      if (usedToken) headers['Authorization'] = `Bearer ${usedToken}`;

      const res = await fetch('/api/notes/pending', { headers });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Unauthorized. Please log in as admin.');
          setPending([]);
          setLoading(false);
          return;
        }
        const t = await res.text();
        throw new Error(`${res.status} ${t}`);
      }
      const j = await res.json();
      setPending(Array.isArray(j) ? j : []);
    } catch (err: any) {
      console.error('Failed to load pending notes', err);
      setError(err?.message || 'Failed to load pending notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, [token]);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this note?')) return;
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      let usedToken = token;
      if (!usedToken) {
        try {
          const saved = localStorage.getItem('libraria_auth');
          if (saved) {
            const parsed = JSON.parse(saved);
            usedToken = parsed?.token || parsed?.access_token || null;
          }
        } catch (e) { /* ignore */ }
      }
      if (usedToken) headers['Authorization'] = `Bearer ${usedToken}`;

      const res = await fetch(`/api/notes/${id}/approve`, { method: 'POST', headers });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${t}`);
      }
      // remove approved note from local list
      setPending(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      console.error('Approve failed', err);
      alert('Failed to approve note: ' + (err?.message || 'Unknown'));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 dark:text-white">New Notes — Approvals</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="space-y-3">
        {pending.map(n => (
          <Card key={n.id} className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-sm text-gray-500">Uploaded by {n.uploaded_by || 'Unknown'} • {new Date(n.created_at).toLocaleString()}</p>
                {n.description && <p className="mt-2 text-sm">{n.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  // open modal viewer with the backend view URL
                  setPreviewUrl(`/api/notes/${n.id}/view`);
                  // pass file type so viewer can choose embed method
                  setPreviewType(n.file_type || 'pdf');
                }}>
                  Preview
                </Button>
                <Button variant="secondary" onClick={() => handleApprove(n.id)}>Approve</Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={async () => {
                    const reasonInput = prompt('Reason for rejection (optional):', 'NONE');
                    const reason = (reasonInput === null || reasonInput === '') ? 'NONE' : reasonInput;
                    if (!confirm('Reject this note?')) return;
                    try {
                      const headers: Record<string, string> = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
                      let usedToken = token;
                      if (!usedToken) {
                        try {
                          const saved = localStorage.getItem('libraria_auth');
                          if (saved) {
                            const parsed = JSON.parse(saved);
                            usedToken = parsed?.token || parsed?.access_token || null;
                          }
                        } catch (e) { /* ignore */ }
                      }
                      if (usedToken) headers['Authorization'] = `Bearer ${usedToken}`;

                      const res = await fetch(`/api/notes/${n.id}/reject`, { method: 'POST', headers, body: JSON.stringify({ reason }) });
                      if (!res.ok) {
                        const t = await res.text();
                        throw new Error(`${res.status} ${t}`);
                      }

                      // remove rejected note from local list
                      setPending(prev => prev.filter(item => item.id !== n.id));
                    } catch (err: any) {
                      console.error('Reject failed', err);
                      alert('Failed to reject note: ' + (err?.message || 'Unknown'));
                    }
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {(!loading && pending.length === 0) && <div className="p-4 text-gray-600">No pending notes.</div>}
      </div>
      {previewUrl && (
        <FileViewer
          url={previewUrl}
          type={previewType}
          role="admin"
          onClose={() => { setPreviewUrl(''); setPreviewType(''); }}
        />
      )}
    </div>
  );
};

export default RejectedNotesPage;
