import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { ParticleSystem, Animated3DHeader } from '../../../components/3d';

export const RecommendedNotesPage: React.FC = () => {
  const recommendations = [
    { id: 'r1', title: 'DBMS Advanced', reason: 'You viewed DBMS notes' },
    { id: 'r2', title: 'SQL Queries', reason: 'You borrowed DBMS book' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <ParticleSystem particleCount={120} color="#f97316" speed={0.001} />

      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none z-0">
            <Animated3DHeader title="Recommended Notes" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">✨ Recommended Notes</h2>
              <p className="text-gray-600 dark:text-amber-200 text-sm">
                AI-powered recommendations based on your activity
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((r, index) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -8 }}
              className="cursor-pointer h-full"
            >
              <motion.div
                className="h-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-md hover:shadow-2xl hover:border-orange-200 dark:hover:border-orange-900/50 transition-all p-6"
                whileHover={{ boxShadow: '0 20px 40px rgba(249, 115, 22, 0.15)' }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-amber-100 mb-2">{r.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-amber-200">{r.reason}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <BookOpenIcon className="w-5 h-5" />
                  Open
                </motion.button>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendedNotesPage;
