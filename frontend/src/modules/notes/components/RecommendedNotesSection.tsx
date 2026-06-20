import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpenIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { recommendedNotesService } from '../../../services/notesRecommendationService';

interface RecommendedNote {
  id: number;
  title: string;
  subject?: string;
  course?: string;
  semester?: string;
  file_type: string;
  status: string;
  ai_summary?: string;
}

interface RecommendationsResponse {
  recommendations: RecommendedNote[];
  reason: string;
  activity_count?: number;
  interested_subjects?: number;
}

export const RecommendedNotesSection: React.FC<{ onNoteClick?: (noteId: number) => void }> = ({ onNoteClick }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const result: RecommendationsResponse = await recommendedNotesService.getRecommendedNotes(8);
        setRecommendations(result.recommendations || []);
        setReason(result.reason || '');
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setRecommendations([]);
        setReason('error');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleNoteClick = (noteId: number) => {
    if (onNoteClick) {
      onNoteClick(noteId);
    } else {
      // Navigate to note view page
      navigate(`../note/${noteId}`);
    }
  };

  // New user with no activity
  if (!loading && reason === 'new_user') {
    return (
      <div className="py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Recommended For You</h2>
            <p className="text-gray-600 dark:text-gray-400">Get started by exploring notes</p>
          </div>
          <Button 
            variant="outlined" 
            size="sm"
            onClick={() => navigate('all')}
            className="flex items-center gap-2"
          >
            Explore
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
        <Card className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Recent Activity
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start exploring notes to get personalized recommendations!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Browse notes, download them, or view their summaries to see recommendations tailored to your interests.
          </p>
        </Card>
      </div>
    );
  }

  // No recommendations found (but user has activity)
  if (!loading && recommendations.length === 0 && reason !== 'new_user') {
    return (
      <div className="py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Recommended For You</h2>
            <p className="text-gray-600 dark:text-gray-400">No recommendations yet</p>
          </div>
          <Button 
            variant="outlined" 
            size="sm"
            onClick={() => navigate('all')}
            className="flex items-center gap-2"
          >
            Explore
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
        <Card className="text-center py-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Explore More Notes
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No available notes matching your interests right now. Explore our full catalog to discover more!
          </p>
          <Button onClick={() => navigate('all')}>
            Browse All Notes
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Recommended For You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Display recommendations
  return (
    <div className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">Recommended For You</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Based on your interests in specific subjects and popular choices
          </p>
        </div>
        <Button 
          variant="outlined" 
          size="sm"
          onClick={() => navigate('all')}
          className="flex items-center gap-2"
        >
          Explore All
          <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((note, index) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="cursor-pointer group"
            onClick={() => handleNoteClick(note.id)}
          >
            <Card hover className="h-full flex flex-col overflow-hidden">
              {/* Content */}
              <div className="flex-1 flex flex-col p-4">
                <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-900 dark:text-white">
                  {note.title}
                </h3>
                
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  {note.subject && (
                    <p><strong>Subject:</strong> {note.subject}</p>
                  )}
                  {note.course && (
                    <p><strong>Course:</strong> {note.course}</p>
                  )}
                  {note.semester && (
                    <p><strong>Semester:</strong> {note.semester}</p>
                  )}
                  <p><strong>Type:</strong> {note.file_type}</p>
                </div>

                {note.ai_summary && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 line-clamp-2">
                    {note.ai_summary}
                  </p>
                )}

                {/* Action Button */}
                <div className="mt-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full flex items-center justify-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNoteClick(note.id);
                    }}
                  >
                    View
                    <ArrowRightIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      {recommendations.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button variant="outlined" onClick={() => navigate('all')}>
            View All Notes
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};
