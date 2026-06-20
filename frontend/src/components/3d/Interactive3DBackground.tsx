import React from 'react';

interface Interactive3DBackgroundProps {
  width: number;
  height: number;
  enabled: boolean;
}

export const Interactive3DBackground: React.FC<Interactive3DBackgroundProps> = ({ width, height, enabled }) => {
  if (!enabled) return null;
  
  return (
    <div 
      className="absolute inset-0 opacity-10 pointer-events-none"
      style={{ width, height }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 animate-pulse" />
    </div>
  );
};
