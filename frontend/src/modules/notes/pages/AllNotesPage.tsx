import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentTextIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { ParticleSystem, Animated3DHeader } from '../../../components/3d';
import FileViewer from '../../../components/FileViewer';
import { useAuth } from '../../../hooks/useAuth';

type NoteSummary = {
  id: string;
  title: string;
  description: string;
  uploader: string;
  tags: string[] | string;
  thumbnail?: string | null;
  subject?: string;
  semester?: string;
  course?: string;
  status?: string;
  ai_keywords?: string | string[] | null;
};

export const AllNotesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [modalNote, setModalNote] = useState<NoteSummary | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewType, setPreviewType] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterSemester, setFilterSemester] = useState<string>('');
  const { token } = useAuth() as any;

  useEffect(() => {
    // frontend-only: fetch from backend if available, otherwise use mock
    (async () => {
      try {
        const res = await fetch('/api/notes');
        if (!res.ok) throw new Error('no api');
        const j = await res.json();
        setNotes(j || []);
      } catch (e) {
        // fallback mock
        setNotes([
          { id: '1', title: 'Intro to DBMS', description: 'Database notes', uploader: 'Alice', tags: ['db','sql'], thumbnail: null, subject: 'DBMS', semester: '4', course: 'CS', status: 'approved' },
          { id: '2', title: 'Algorithms notes', description: 'Sorting and graphs', uploader: 'Bob', tags: ['algorithms'], thumbnail: null, subject: 'Algorithms', semester: '3', course: 'CS', status: 'approved' }
        ]);
      }
    })();
  }, []);

  // Only show approved notes
  const approved = notes.filter(n => String(n.status || '').toLowerCase() === 'approved');

  // Auto-open modal if noteId is in URL
  useEffect(() => {
    const noteId = searchParams.get('noteId');
    console.log('Checking for noteId:', noteId, 'notes length:', notes.length);
    if (noteId && notes.length > 0) {
      // Compare both as strings to handle type mismatches
      const note = notes.find(n => String(n.id) === String(noteId));
      console.log('Found note:', note);
      if (note) {
        setModalNote(note);
        // Remove the noteId parameter from URL after opening modal
        setSearchParams({});
      }
    }
  }, [notes, searchParams, setSearchParams]);

  // Get unique filter options
  const uniqueSubjects = Array.from(new Set(approved.map(n => n.subject).filter(Boolean)));
  const uniqueCourses = Array.from(new Set(approved.map(n => n.course).filter(Boolean)));
  const uniqueSemesters = Array.from(new Set(approved.map(n => n.semester).filter(Boolean)));

  const filtered = approved.filter(n => {
    // Apply text search
    let matchesSearch = true;
    if (query) {
      const q = query.toLowerCase();
      const inTitle = String(n.title || '').toLowerCase().includes(q);
      const inDesc = String(n.description || '').toLowerCase().includes(q);
      const inSubject = String(n.subject || '').toLowerCase().includes(q);
      const keywords = (() => {
        if (!n.ai_keywords) return '';
        if (Array.isArray(n.ai_keywords)) return n.ai_keywords.join(' ');
        try { return String(n.ai_keywords); } catch { return ''; }
      })().toLowerCase();
      const tagsStr = (Array.isArray(n.tags) ? n.tags.join(' ') : String(n.tags || '')).toLowerCase();
      matchesSearch = inTitle || inDesc || inSubject || keywords.includes(q) || tagsStr.includes(q);
    }

    // Apply filter criteria
    const matchesSubject = !filterSubject || String(n.subject || '').toLowerCase() === filterSubject.toLowerCase();
    const matchesCourse = !filterCourse || String(n.course || '').toLowerCase() === filterCourse.toLowerCase();
    const matchesSemester = !filterSemester || String(n.semester || '').toLowerCase() === filterSemester.toLowerCase();

    return matchesSearch && matchesSubject && matchesCourse && matchesSemester;
  });

  // Sort notes
  const sortedNotes = [...filtered].sort((a, b) => {
    if (sort === 'newest') {
      // Sort by ID descending (assuming higher ID = newer)
      const aId = parseInt(a.id) || 0;
      const bId = parseInt(b.id) || 0;
      return bId - aId;
    } else if (sort === 'most_downloaded') {
      // Sort by download count (need to add this field to API)
      const aDownloads = (a as any).download_count || 0;
      const bDownloads = (b as any).download_count || 0;
      return bDownloads - aDownloads;
    } else if (sort === 'faculty') {
      // Show faculty notes first
      const aIsFaculty = (a as any).is_faculty || (a as any).uploader_type === 'faculty';
      const bIsFaculty = (b as any).is_faculty || (b as any).uploader_type === 'faculty';
      if (aIsFaculty && !bIsFaculty) return -1;
      if (!aIsFaculty && bIsFaculty) return 1;
      return 0;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* 3D Particle Background */}
      <ParticleSystem particleCount={120} color="#f97316" speed={0.001} />

      {/* Header with enhanced styling */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 3D Animated Header Background */}
          <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none z-0">
            <Animated3DHeader title="All Notes" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">📚 All Notes</h2>
              <p className="text-gray-600 dark:text-amber-200 text-sm">
                Discover and access shared study materials
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Search Bar */}
        <motion.div className="mb-8 space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <motion.div whileHover={{ scale: 1.02 }} className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400" />
                <Input 
                  placeholder="Search notes (title, subject, keywords, tags)" 
                  value={query} 
                  onChange={(e:any) => setQuery(e.target.value)} 
                  className="pl-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50 transition-all" 
                />
              </motion.div>
            </div>
            <motion.select
              whileHover={{ scale: 1.02 }}
              className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50 transition-all cursor-pointer" 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="most_downloaded">Most downloaded</option>
              <option value="faculty">Faculty notes</option>
            </motion.select>
            <div className="ml-auto flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Grid view"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="List view"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>
            </div>
      </div>
        </motion.div>

        {/* Advanced Filters */}
        <motion.div 
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-100 dark:border-gray-700 shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-lg bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-amber-200 block mb-2">Subject</label>
              <select className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50 transition-all cursor-pointer" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {uniqueSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-amber-200 block mb-2">Course</label>
              <select className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50 transition-all cursor-pointer" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="">All Courses</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-amber-200 block mb-2">Semester</label>
              <select className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/50 transition-all cursor-pointer" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {uniqueSemesters.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
          {(filterSubject || filterCourse || filterSemester) && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setFilterSubject(''); setFilterCourse(''); setFilterSemester(''); }} 
              className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-red-600 dark:hover:text-red-400 mt-4 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear All Filters
            </motion.button>
          )}
        </motion.div>

        {/* Results Count */}
        <motion.div 
          className="text-sm text-gray-700 dark:text-amber-100 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Found <span className="font-bold text-orange-600 dark:text-orange-400">{sortedNotes.length}</span> note{sortedNotes.length !== 1 ? 's' : ''}
          {sort === 'newest' && <span className="ml-2 text-xs text-gray-500 dark:text-amber-200">(sorted by newest first)</span>}
          {sort === 'most_downloaded' && <span className="ml-2 text-xs text-gray-500 dark:text-amber-200">(sorted by most downloaded)</span>}
          {sort === 'faculty' && <span className="ml-2 text-xs text-gray-500 dark:text-amber-200">(faculty notes first)</span>}
        </motion.div>

        <div className={viewMode==='grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {sortedNotes.map((n, index) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -8 }}
              className="cursor-pointer h-full"
              onClick={() => setModalNote(n)}
            >
              <motion.div
                className="h-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-md hover:shadow-2xl hover:border-orange-200 dark:hover:border-orange-900/50 transition-all"
                whileHover={{ boxShadow: '0 20px 40px rgba(249, 115, 22, 0.15)' }}
              >
                <Card hover={false} variant="elevated" elevation={0} className="h-full p-0 border-0 shadow-none">
                  <div className="p-6">
                    {viewMode==='grid' ? (
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-amber-100 truncate">{n.title}</h3>
                            <p className="text-xs text-gray-600 dark:text-amber-200 truncate">By {(n as any).uploader_name || n.uploader}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-amber-100 mb-4 line-clamp-3">{n.description}</p>
                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex flex-wrap gap-2 text-xs">
                            {n.subject && <span className="px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">{n.subject}</span>}
                            {n.semester && <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">Sem {n.semester}</span>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                          <DocumentTextIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-amber-100">{n.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-amber-100 line-clamp-2">{n.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-600 dark:text-amber-200">By {(n as any).uploader_name || n.uploader}</p>
                          <div className="flex gap-2 mt-2 justify-end">
                            {n.subject && <span className="px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">{n.subject}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Modal for note details */}
        <AnimatePresence>
          {modalNote && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" 
                onClick={() => setModalNote(null)}
              >
                <div className="w-full max-w-7xl mx-auto px-4 h-full flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl p-0 overflow-hidden border-2 border-orange-200 dark:border-orange-900/50" 
                    onClick={e => e.stopPropagation()}
                  >
                <div className="relative bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 p-6 flex gap-6">
                  {/* Left: thumbnail / placeholder */}
                  <div className="w-36 h-48 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg">
                    <DocumentTextIcon className="w-20 h-20" />
                  </div>

                  {/* Middle: details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">{modalNote.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-amber-200 mt-2">Uploaded by: <span className="font-semibold text-orange-600 dark:text-orange-400">{(modalNote as any).uploader_name || modalNote.uploader}</span></p>
                        <p className="mt-3 text-gray-700 dark:text-amber-100">{modalNote.description}</p>
                      </div>
                 
                </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-amber-100">
                      <div><strong className="text-orange-600 dark:text-orange-400">Course: </strong>{modalNote.course || '-'}</div>
                      <div><strong className="text-orange-600 dark:text-orange-400">Subject: </strong>{modalNote.subject || '-'}</div>
                      <div><strong className="text-orange-600 dark:text-orange-400">Semester: </strong>{modalNote.semester || '-'}</div>
                      <div><strong className="text-orange-600 dark:text-orange-400">Tags: </strong>{(Array.isArray(modalNote.tags) ? modalNote.tags.join(', ') : modalNote.tags) || '-'}</div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="w-40 flex flex-col items-stretch gap-3 p-2">
                    {/* Close cross */}
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Close" 
                      onClick={() => setModalNote(null)} 
                      className="ml-4 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                      onClick={async () => {
                        try {
                          // Post access log (viewed)
                          await fetch(`/api/notes/${modalNote.id}/access`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({ action: 'viewed' })
                          });
                        } catch (e) {
                          // ignore logging failures
                        }
                        setPreviewUrl(`/api/notes/${modalNote.id}/view`);
                        setPreviewType((modalNote as any).file_type || 'pdf');
                      }}
                    >
                      Open
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                      onClick={async () => {
                  try {
                    // Post access log (downloaded)
                    try {
                      await fetch(`/api/notes/${modalNote.id}/access`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ action: 'downloaded' })
                      });
                    } catch (e) { /* ignore */ }

                    const res = await fetch(`/api/notes/${modalNote.id}/download`);
                    if (!res.ok) throw new Error('download failed');
                    const j = await res.json();
                    const url = j?.url;
                    if (url) window.open(url, '_blank');
                      } catch (err) {
                        alert('Download failed');
                      }
                    }}
                  >
                    Download
                  </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {previewUrl && (
          <FileViewer url={previewUrl} type={previewType} role="user" onClose={() => { setPreviewUrl(''); setPreviewType(''); }} />
        )}
      </div>
    </div>
  );
};

export default AllNotesPage;
