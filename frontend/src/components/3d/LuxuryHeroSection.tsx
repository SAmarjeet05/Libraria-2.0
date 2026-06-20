import React from 'react';
import { motion } from 'framer-motion';
import { LuxuryLibraryScene } from './LuxuryLibraryScene';
import { SparklesIcon, BookOpenIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  onExplore?: () => void;
}

export const LuxuryHeroSection: React.FC<HeroSectionProps> = ({
  title = 'Libraria',
  subtitle = 'Your Digital Knowledge Hub',
  onExplore,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-slate-900 overflow-hidden">
      {/* 3D Background Scene */}
      <LuxuryLibraryScene className="z-0" />

      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40 z-10 pointer-events-none" />

      {/* Content */}
      <motion.div
        className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Decorative glow */}
        <motion.div
          className="absolute top-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Main Title */}
        <motion.div variants={itemVariants} className="mb-6">
          <motion.h1
            className="text-7xl md:text-8xl font-black bg-gradient-to-r from-amber-200 via-amber-100 to-orange-200 bg-clip-text text-transparent drop-shadow-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {title}
          </motion.h1>
          <motion.div
            className="flex items-center justify-center gap-2 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="h-1 w-12 bg-gradient-to-r from-amber-400 to-transparent rounded-full" />
            <SparklesIcon className="w-6 h-6 text-amber-300 animate-pulse" />
            <div className="h-1 w-12 bg-gradient-to-l from-amber-400 to-transparent rounded-full" />
          </motion.div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-xl md:text-3xl text-amber-100 font-light mb-8 max-w-2xl drop-shadow-lg"
        >
          {subtitle}
        </motion.p>

        {/* Feature Pills */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap gap-4 justify-center mb-12"
        >
          {[
            { icon: BookOpenIcon, label: 'Notes', color: 'from-amber-500 to-orange-600' },
            { icon: VideoCameraIcon, label: 'Videos', color: 'from-blue-500 to-cyan-600' },
            { icon: SparklesIcon, label: 'AI Tools', color: 'from-purple-500 to-pink-600' },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              className={`px-6 py-3 rounded-full bg-gradient-to-r ${feature.color} backdrop-blur-md bg-opacity-20 border border-white/20 flex items-center gap-2 hover:bg-opacity-30 transition-all cursor-pointer`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <feature.icon className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={onExplore}
            className="px-8 py-4 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 text-gray-900 font-bold text-lg rounded-full shadow-2xl hover:shadow-amber-500/50"
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(217, 119, 6, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Now
          </motion.button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 flex flex-col items-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-amber-200 text-sm font-light mb-2">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-amber-400 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-2 bg-amber-400 rounded-full mt-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
