import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import FileViewer from '../../../components/FileViewer';

const PendingNotesReview: React.FC = () => {
  const pending = [
    { id: 'p1', title: 'Calculus notes', uploader: 'Student A', uploaded_at: '2025-11-02T07:30:00Z' },
    { id: 'p2', title: 'Networks notes', uploader: 'Student B', uploaded_at: '2025-11-03T10:20:00Z' }
  ];
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewType, setPreviewType] = useState<string>('pdf');

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Pending Notes Review</h2>
      <div className="space-y-3">
        {pending.map(p => (
          <Card key={p.id} className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-gray-500">Uploaded by {p.uploader} • {new Date(p.uploaded_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { setPreviewUrl(`/api/notes/${p.id}/view`); setPreviewType('pdf'); }}>Preview</Button>
                <Button variant="secondary">Approve</Button>
                <Button variant="secondary">Reject</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {previewUrl && (
        <FileViewer url={previewUrl} role="admin" type={previewType} onClose={() => setPreviewUrl('')} />
      )}
    </div>
  );
};

export default PendingNotesReview;
