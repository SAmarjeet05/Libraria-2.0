import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const FloatingMic: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  if (!isSupported) {
    return null; // Hide if speech recognition is not supported
  }

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsExpanded(true)}
        className={`
          fixed bottom-6 right-6 w-14 h-14 rounded-full z-50
          bg-gradient-to-r from-neon-purple to-neon-pink text-white
          shadow-lg hover:shadow-xl transition-all duration-300
          flex items-center justify-center
          ${isListening ? 'animate-pulse' : ''}
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Voice Assistant"
      >
        <MicrophoneIcon className="w-6 h-6" />
      </motion.button>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="relative">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="pr-12">
                  <h3 className="text-lg font-semibold mb-4">Voice Assistant</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Button
                        onClick={handleToggleListening}
                        variant={isListening ? 'secondary' : 'neon'}
                        size="lg"
                        className={isListening ? 'animate-pulse' : ''}
                      >
                        <MicrophoneIcon className="w-5 h-5 mr-2" />
                        {isListening ? 'Stop Listening' : 'Start Listening'}
                      </Button>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                        {error}
                      </div>
                    )}

                    {isListening && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Listening...</p>
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-8 bg-blue-500 rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {transcript && (
                      <div className="space-y-3">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-700 dark:text-green-300 mb-1">Transcript:</p>
                          <p className="text-gray-900 dark:text-gray-100">{transcript}</p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={resetTranscript}>
                            Clear
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => navigator.clipboard.writeText(transcript)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isListening && !transcript && (
                      <div className="text-center py-8">
                        <MicrophoneIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Click "Start Listening" to begin voice input
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Try saying: "Search for React tutorials" or "Create a new note"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};