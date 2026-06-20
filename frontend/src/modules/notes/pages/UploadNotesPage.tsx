import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ParticleSystem, Animated3DHeader } from '../../../components/3d';

export const UploadNotesPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { token } = useAuth() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side validation: all fields required
    // Trim text fields to avoid whitespace-only entries
    const tTitle = title?.toString().trim() || '';
    const tDescription = description?.toString().trim() || '';
    const tSubject = subject?.toString().trim() || '';
    const tCourse = course?.toString().trim() || '';
    const tSemester = semester?.toString().trim() || '';
    const tTags = tags?.toString().trim() || '';

    // Debug: log current values (open browser console to see)
    // eslint-disable-next-line no-console
    console.log('UploadNotesPage submit values:', { tTitle, tDescription, tSubject, tCourse, tSemester, tTags, file });

    if (!tTitle || !tDescription || !tSubject || !tCourse || !tSemester || !tTags || !file) {
      alert('Please fill all fields and attach a file before uploading.');
      return;
    }
    // Submit to backend API using multipart/form-data (file upload)
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('subject', subject);
      form.append('course', course);
      form.append('semester', semester);
      form.append('tags', tags);
      if (file) form.append('file', file);

      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/notes/upload', {
        method: 'POST',
        headers,
        body: form
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to upload note');
      }

      const data = await res.json();
      alert('Note uploaded. Status: ' + (data.status || 'pending'));
      // Optionally reset form
      setTitle(''); setDescription(''); setSubject(''); setCourse(''); setSemester(''); setTags(''); setFile(null);
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <ParticleSystem particleCount={120} color="#f97316" speed={0.001} />

      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none z-0">
            <Animated3DHeader title="Upload Notes" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">☁️ Upload Note</h2>
              <p className="text-gray-600 dark:text-amber-200 text-sm">
                Share your knowledge with fellow students
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-lg p-8"
        >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Title" value={title} onChange={(e:any) => setTitle(e.target.value)} />
          <Input label="Description" value={description} onChange={(e:any) => setDescription(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Subject" value={subject} onChange={(e:any) => setSubject(e.target.value)} />
            <Input label="Course" value={course} onChange={(e:any) => setCourse(e.target.value)} />
            <Input label="Semester" value={semester} onChange={(e:any) => setSemester(e.target.value)} />
          </div>
          <Input label="Tags (comma separated)" value={tags} onChange={(e:any) => setTags(e.target.value)} />

          <div>
            <label className="block mb-1">File (PDF, DOC, PPT)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e:any) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit">Upload</Button>
          </div>
        </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadNotesPage;
