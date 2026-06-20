import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

const ManageTagsSubjects: React.FC = () => {
  const tags = ['db', 'algorithms', 'os'];
  const subjects = ['DBMS', 'Algorithms', 'Operating Systems'];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Manage Tags & Subjects</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Tags</h3>
          <ul>
            {tags.map(t => <li key={t} className="py-1">{t}</li>)}
          </ul>
          <div className="mt-3">
            <input className="px-2 py-1 border rounded" placeholder="New tag" />
            <Button className="ml-2">Add</Button>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Subjects</h3>
          <ul>
            {subjects.map(s => <li key={s} className="py-1">{s}</li>)}
          </ul>
          <div className="mt-3">
            <input className="px-2 py-1 border rounded" placeholder="New subject" />
            <Button className="ml-2">Add</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManageTagsSubjects;
