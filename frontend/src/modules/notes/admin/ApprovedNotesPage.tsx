import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

const ApprovedNotesPage: React.FC = () => {
  const approved = [
    { id: 'a1', title: 'DBMS Advanced', uploader: 'Faculty X' },
    { id: 'a2', title: 'Operating Systems', uploader: 'Faculty Y' }
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Approved Notes</h2>
      <div className="space-y-3">
        {approved.map(a => (
          <Card key={a.id} className="p-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-sm text-gray-500">By {a.uploader}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">Edit Metadata</Button>
              <Button>Remove</Button>
              <Button variant="secondary">Feature</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ApprovedNotesPage;
