import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export const NoteViewPage: React.FC = () => {
  const { noteId } = useParams();

  // frontend-only placeholder data
  const note = {
    id: noteId,
    title: 'Intro to DBMS',
    description: 'Full lecture notes on database systems',
    uploader: 'Alice',
    subject: 'DBMS',
    semester: '4',
    tags: ['db','sql'],
    uploaded_at: '2025-11-02T07:30:00Z'
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{note.title}</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="p-4">
            {/* Embedded PDF viewer placeholder */}
            <div className="w-full h-[600px] bg-gray-50 flex items-center justify-center">PDF Viewer (embed)</div>
          </Card>

          <div className="flex gap-2 mt-3">
            <Button>Download</Button>
            <Button variant="secondary">Add to favourites</Button>
            <Button variant="secondary">AI Summarize</Button>
            <Button variant="secondary">AI Generate MCQs</Button>
            <Button variant="secondary">AI Flashcards</Button>
            <Button variant="secondary">Chat (Explain)</Button>
          </div>
        </div>

        <aside>
          <Card className="p-4">
            <h3 className="font-semibold">Details</h3>
            <p className="text-sm text-gray-600">Subject: {note.subject}</p>
            <p className="text-sm text-gray-600">Semester: {note.semester}</p>
            <p className="text-sm text-gray-600">Tags: {note.tags.join(', ')}</p>
            <p className="text-sm text-gray-600">Uploaded: {new Date(note.uploaded_at).toLocaleString()}</p>
            <p className="text-sm text-gray-600">By: {note.uploader}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default NoteViewPage;
