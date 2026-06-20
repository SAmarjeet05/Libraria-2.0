import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

const FacultyNotesManager: React.FC = () => {
  const faculty = [
    { id: 'f1', name: 'Dr. Smith', department: 'CS' },
    { id: 'f2', name: 'Dr. Lee', department: 'IT' }
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Faculty Notes Manager</h2>
      <div className="space-y-3">
        {faculty.map(f => (
          <Card key={f.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{f.name}</div>
              <div className="text-sm text-gray-500">{f.department}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">View Notes</Button>
              <Button>Assign Reviewer</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FacultyNotesManager;
