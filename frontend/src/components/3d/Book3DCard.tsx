import React from 'react';
import { motion } from 'framer-motion';

interface Book3DCardProps {
  coverUrl: string;
  title: string;
  author: string;
  onClick?: () => void;
}

export const Book3DCard: React.FC<Book3DCardProps> = ({ coverUrl, title, author: _author, onClick }) => {
  return (
    <motion.div
      whileHover={{ rotateY: 5, rotateX: 5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="perspective-1000 mb-3"
      onClick={onClick}
      style={{ perspective: '1000px' }}
    >
      <div className="relative w-full h-80 md:h-96 transform-style-3d transition-transform duration-300">
        <img
          src={coverUrl}
          alt={`${title} cover`}
          className="w-full h-full object-cover rounded-md shadow-xl"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-md" />
      </div>
    </motion.div>
  );
};
