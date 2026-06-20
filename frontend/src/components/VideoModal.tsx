import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
  thumbnail?: string;
  onVideoEnd?: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoId,
  title
}) => {
  useEffect(() => {
    if (isOpen) {
      // Add ESC key handler
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleEscKey);
      return () => {
        window.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 right-0 bottom-0 bg-black/90 backdrop-blur-sm z-[999999999] flex flex-col"
          style={{ left: '360px', top: '-50px' }}
          onClick={onClose}
        >
          {/* Close Button - Highest z-index */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[1000000000] bg-red-600 hover:bg-red-700 rounded-full p-3 transition-colors shadow-lg"
            title="Close video (ESC)"
          >
            <XCircleIcon className="w-6 h-6 text-white" />
          </button>

          {/* Main video container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex flex-col bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Title */}
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-800 flex-shrink-0">
              <h2 className="text-2xl font-semibold text-white line-clamp-2">{title}</h2>
            </div>

            {/* Video Container - Full height */}
            <div className="flex-1 relative w-full bg-black overflow-hidden">
              <iframe
                className="w-full h-full"
                src={embedUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>

            {/* Controls */}
            <div className="bg-gray-900 px-6 py-4 border-t border-gray-800 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-400">
                Press ESC or click X to close
              </div>
              <Button
                variant="outlined"
                size="sm"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
